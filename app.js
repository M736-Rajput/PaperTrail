/**
 * PaperTrail - Frontend Application Logic
 * Integrates live Europe PMC REST API search, paper discovery feed,
 * abstract reader, and interactive demo evidence assessments.
 */

// Application State
const state = {
    currentQuery: '',
    currentPage: 1,
    pageSize: 25,
    sort: '',
    yearFilter: 'all',
    openAccessOnly: false,
    hasAbstractOnly: true,
    reviewOnly: false,
    totalHits: 0,
    currentResults: [],
    activeTab: 'live', // 'live' or 'demo'
    selectedDemoIndex: 0,
    selectedPaperForModal: null,
    isSearching: false
};

// Europe PMC API Base URL
const EPMC_API_BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderPresetPills();
    renderDemoAssessments();
    initEventListeners();
    checkUrlParams();
});

/* ==========================================================================
   Theme Management
   ========================================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem('papertrail_theme') || 'theme-dark';
    document.body.className = savedTheme;
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'theme-light' : 'theme-dark';
    document.body.className = newTheme;
    localStorage.setItem('papertrail_theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (theme === 'theme-light') {
        // Sun icon
        icon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    } else {
        // Moon icon
        icon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }
}

/* ==========================================================================
   Navigation & Tabs
   ========================================================================== */
function switchMainTab(tab) {
    state.activeTab = tab;
    
    // Toggle nav tab button classes
    const liveBtn = document.getElementById('tab-btn-live');
    const demoBtn = document.getElementById('tab-btn-demo');
    const liveView = document.getElementById('view-live-search');
    const demoView = document.getElementById('view-evidence-demo');

    if (tab === 'live') {
        liveBtn.classList.add('active');
        demoBtn.classList.remove('active');
        liveView.classList.add('active');
        demoView.classList.remove('active');
    } else {
        liveBtn.classList.remove('active');
        demoBtn.classList.add('active');
        liveView.classList.remove('active');
        demoView.classList.add('active');
    }
}

/* ==========================================================================
   Preset Queries & Search Input
   ========================================================================== */
function renderPresetPills() {
    const container = document.getElementById('preset-pills-container');
    if (!container || !PRESET_QUERIES) return;

    container.innerHTML = PRESET_QUERIES.map((item, idx) => `
        <div class="preset-pill" onclick="triggerPresetSearch(${idx})" title="${escapeHtml(item.description)}">
            <span class="pill-icon">${item.icon}</span>
            <span>${escapeHtml(item.title)}</span>
        </div>
    `).join('');
}

function triggerPresetSearch(index) {
    const preset = PRESET_QUERIES[index];
    if (!preset) return;
    const input = document.getElementById('claim-search-input');
    input.value = preset.query;
    toggleClearButton();
    switchMainTab('live');
    executeSearch(preset.query, 1);
}

function initEventListeners() {
    const input = document.getElementById('claim-search-input');
    if (input) {
        input.addEventListener('keyup', (e) => {
            toggleClearButton();
            if (e.key === 'Enter') {
                handleSearchSubmit();
            }
        });
    }
}

function toggleClearButton() {
    const input = document.getElementById('claim-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) {
        clearBtn.style.display = input.value.trim().length > 0 ? 'inline-block' : 'none';
    }
}

function clearSearchInput() {
    const input = document.getElementById('claim-search-input');
    input.value = '';
    toggleClearButton();
    input.focus();
}

function handleSearchSubmit() {
    const input = document.getElementById('claim-search-input');
    const query = input.value.trim();
    if (!query) {
        input.focus();
        showToast('Please enter a scientific claim or query to search.');
        return;
    }
    switchMainTab('live');
    executeSearch(query, 1);
}

function handleFilterChange() {
    state.sort = document.getElementById('filter-sort').value;
    state.yearFilter = document.getElementById('filter-years').value;
    state.openAccessOnly = document.getElementById('filter-oa').checked;
    state.hasAbstractOnly = document.getElementById('filter-abstract').checked;
    state.reviewOnly = document.getElementById('filter-review').checked;
    state.pageSize = parseInt(document.getElementById('filter-page-size').value, 10) || 25;

    if (state.currentQuery) {
        executeSearch(state.currentQuery, 1);
    }
}

/* ==========================================================================
   Europe PMC Query Construction & Execution
   ========================================================================== */
function buildEuropePMCQueryString(userQuery) {
    let queryParts = [];
    
    // Core user keywords / claim
    queryParts.push(userQuery.trim());

    // Filter: Open Access
    if (state.openAccessOnly) {
        queryParts.push('OPEN_ACCESS:y');
    }

    // Filter: Has Abstract
    if (state.hasAbstractOnly) {
        queryParts.push('HAS_ABSTRACT:y');
    }

    // Filter: Reviews only
    if (state.reviewOnly) {
        queryParts.push('(PUB_TYPE:"Review" OR PUB_TYPE:"systematic review")');
    }

    // Filter: Publication Years
    const currentYear = new Date().getFullYear();
    if (state.yearFilter === '2024-2026') {
        queryParts.push('(PUB_YEAR:[2024 TO 2026])');
    } else if (state.yearFilter === 'last5') {
        queryParts.push(`(PUB_YEAR:[${currentYear - 5} TO ${currentYear}])`);
    } else if (state.yearFilter === 'last10') {
        queryParts.push(`(PUB_YEAR:[${currentYear - 10} TO ${currentYear}])`);
    }

    return queryParts.join(' AND ');
}

async function executeSearch(query, page = 1) {
    if (state.isSearching) return;
    state.isSearching = true;
    state.currentQuery = query;
    state.currentPage = page;

    // UI state adjustments
    const skeleton = document.getElementById('results-loading-skeleton');
    const feed = document.getElementById('papers-feed-container');
    const metaBar = document.getElementById('results-meta-bar');
    const paginationBar = document.getElementById('pagination-bar');
    const searchBtn = document.getElementById('search-submit-btn');

    skeleton.style.display = 'flex';
    feed.innerHTML = '';
    metaBar.style.display = 'none';
    paginationBar.style.display = 'none';
    if (searchBtn) searchBtn.disabled = true;

    const fullQueryString = buildEuropePMCQueryString(query);
    const params = new URLSearchParams({
        query: fullQueryString,
        resultType: 'core',
        pageSize: state.pageSize.toString(),
        page: page.toString(),
        format: 'json'
    });

    if (state.sort) {
        params.append('sort', state.sort);
    }

    const apiUrl = `${EPMC_API_BASE}?${params.toString()}`;
    const startTime = performance.now();

    try {
        const response = await fetch(apiUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Europe PMC API responded with status ${response.status}`);
        }

        const data = await response.json();
        const latency = Math.round(performance.now() - startTime);

        state.totalHits = data.hitCount || 0;
        state.currentResults = data.resultList?.result || [];

        renderSearchResults(query, state.currentResults, state.totalHits, latency, page);
    } catch (err) {
        console.error('Error fetching Europe PMC data:', err);
        renderSearchError(query, err.message);
    } finally {
        state.isSearching = false;
        skeleton.style.display = 'none';
        if (searchBtn) searchBtn.disabled = false;
    }
}

/* ==========================================================================
   Render Search Results
   ========================================================================== */
function renderSearchResults(query, papers, totalHits, latency, page) {
    const metaBar = document.getElementById('results-meta-bar');
    const feed = document.getElementById('papers-feed-container');
    const paginationBar = document.getElementById('pagination-bar');

    // Meta bar
    metaBar.style.display = 'flex';
    document.getElementById('meta-query-text').innerText = `Results for "${query}"`;
    document.getElementById('stat-hits-count').innerText = totalHits.toLocaleString();
    document.getElementById('stat-latency').innerText = `${latency}ms`;

    if (papers.length === 0) {
        feed.innerHTML = `
            <div class="empty-state glass">
                <div class="empty-icon">🔍</div>
                <h3>No Matching Papers Found</h3>
                <p>Europe PMC found 0 papers matching your query. Try broadening your terms, unchecking "Open Access Only", or rephrasing your scientific claim.</p>
                <div style="margin-top: 15px;">
                    <button class="btn btn-outline btn-sm" onclick="clearFiltersAndRetry()">Reset Filters &amp; Retry</button>
                </div>
            </div>
        `;
        paginationBar.style.display = 'none';
        return;
    }

    // Render Paper Cards
    feed.innerHTML = papers.map((paper, idx) => renderPaperCard(paper, idx)).join('');

    // Pagination
    renderPagination(totalHits, page);
}

function renderPaperCard(paper, index) {
    const title = cleanPaperTitle(paper.title || 'Untitled Publication');
    const authors = paper.authorString || 'Authors not listed';
    const journal = paper.journalTitle || paper.journalInfo?.journal?.title || 'Unknown Journal';
    const year = paper.pubYear || paper.journalInfo?.yearOfPublication || 'N/D';
    const citations = paper.citedByCount || 0;
    const isOpenAccess = paper.isOpenAccess === 'Y';
    const hasPDF = paper.hasPDF === 'Y';
    const doi = paper.doi;
    const pmid = paper.pmid;
    const id = paper.id;
    const source = paper.source || 'MED';
    const sourceUrl = `https://europepmc.org/article/${source}/${id}`;

    // Process abstract
    const abstractRaw = paper.abstractText || '';
    const cleanAbstract = formatAbstractText(abstractRaw);
    const hasAbstract = cleanAbstract.length > 0;

    return `
        <article class="paper-card glass" id="paper-card-${index}">
            <div class="paper-header">
                <div class="paper-badges">
                    ${isOpenAccess ? '<span class="pill-badge pill-emerald">🔓 Open Access</span>' : ''}
                    ${hasPDF ? '<span class="pill-badge pill-cyan">📄 Full PDF</span>' : ''}
                    ${paper.pubType ? `<span class="pill-badge pill-purple">${escapeHtml(paper.pubType)}</span>` : ''}
                    ${doi ? `<span class="doi-tag">DOI: ${escapeHtml(doi)}</span>` : ''}
                </div>
                <div class="paper-citations" title="${citations} citations recorded in Europe PMC">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span>${citations} cited</span>
                </div>
            </div>

            <h3 class="paper-title" onclick="openPaperDetailModal(${index})" title="Click to view full details and citation generator">
                ${title}
            </h3>

            <div class="paper-authors" title="${escapeHtml(authors)}">
                ${escapeHtml(truncateAuthors(authors, 4))}
            </div>

            <div class="paper-journal-meta">
                <span class="paper-journal-name">${escapeHtml(journal)}</span>
                <span class="meta-dot">&bull;</span>
                <span>Year: ${escapeHtml(year)}</span>
                ${paper.pageInfo ? `<span class="meta-dot">&bull;</span><span>pp. ${escapeHtml(paper.pageInfo)}</span>` : ''}
                ${pmid ? `<span class="meta-dot">&bull;</span><span>PMID: ${escapeHtml(pmid)}</span>` : ''}
            </div>

            ${hasAbstract ? `
                <div class="paper-abstract-box">
                    <div class="abstract-heading">
                        <span>Abstract</span>
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">Europe PMC</span>
                    </div>
                    <div class="abstract-text truncated" id="abstract-text-${index}">
                        ${cleanAbstract}
                    </div>
                    <button class="abstract-toggle-btn" id="abstract-btn-${index}" onclick="toggleAbstract(${index})">
                        <span>Show full abstract</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </div>
            ` : `
                <div class="paper-abstract-box" style="opacity: 0.65; padding: 10px 14px;">
                    <span style="font-size: 0.82rem; color: var(--text-muted); font-style: italic;">Abstract not available in public record. Check source link below.</span>
                </div>
            `}

            <div class="paper-actions">
                <div class="actions-left">
                    <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        Europe PMC
                    </a>
                    ${doi ? `
                        <a href="https://doi.org/${encodeURIComponent(doi)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                            Publisher DOI
                        </a>
                    ` : ''}
                    ${hasPDF ? `
                        <a href="https://europepmc.org/backend/ptpmcrender.fcgi?accid=${id}&blobtype=pdf" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="color: var(--accent-cyan); border-color: rgba(6,182,212,0.3);">
                            Direct PDF
                        </a>
                    ` : ''}
                </div>

                <div class="actions-right">
                    <button class="btn btn-sm btn-subtle" onclick="copyCitationAPA(${index})" title="Copy APA format reference">
                        Copy APA
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="openAlignmentModal(${index})" title="Preview how PaperTrail AI will assess this study against your claim">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        Inspect Alignment (Demo)
                    </button>
                </div>
            </div>
        </article>
    `;
}

function renderSearchError(query, message) {
    const feed = document.getElementById('papers-feed-container');
    feed.innerHTML = `
        <div class="empty-state glass" style="border-color: var(--danger-border);">
            <div class="empty-icon">⚠️</div>
            <h3>Unable to Connect to Europe PMC</h3>
            <p>Error message: <code>${escapeHtml(message)}</code></p>
            <p style="margin-top: 10px;">The European Bioinformatics Institute Europe PMC service may be experiencing temporary rate limits or your network might be blocking public REST endpoints.</p>
            <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn-primary" onclick="executeSearch('${escapeHtml(query)}', 1)">Try Again</button>
                <button class="btn btn-outline" onclick="switchMainTab('demo')">View Demo Evidence Assessments</button>
            </div>
        </div>
    `;
}

function clearFiltersAndRetry() {
    document.getElementById('filter-oa').checked = false;
    document.getElementById('filter-review').checked = false;
    document.getElementById('filter-years').value = 'all';
    handleFilterChange();
}

/* ==========================================================================
   Abstract Expand / Collapse
   ========================================================================== */
function toggleAbstract(index) {
    const el = document.getElementById(`abstract-text-${index}`);
    const btn = document.getElementById(`abstract-btn-${index}`);
    if (!el || !btn) return;

    const isTruncated = el.classList.contains('truncated');
    if (isTruncated) {
        el.classList.remove('truncated');
        btn.innerHTML = `
            <span>Collapse abstract</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
        `;
    } else {
        el.classList.add('truncated');
        btn.innerHTML = `
            <span>Show full abstract</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        `;
    }
}

/* ==========================================================================
   Pagination Handling
   ========================================================================== */
function renderPagination(totalHits, page) {
    const paginationBar = document.getElementById('pagination-bar');
    const totalPages = Math.ceil(totalHits / state.pageSize);
    
    if (totalPages <= 1) {
        paginationBar.style.display = 'none';
        return;
    }

    paginationBar.style.display = 'flex';
    document.getElementById('page-indicator-text').innerText = `Page ${page} of ${Math.min(totalPages, 100).toLocaleString()}`;
    
    const prevBtn = document.getElementById('btn-prev-page');
    const nextBtn = document.getElementById('btn-next-page');

    prevBtn.disabled = page <= 1;
    prevBtn.style.opacity = page <= 1 ? '0.4' : '1';

    nextBtn.disabled = page >= totalPages;
    nextBtn.style.opacity = page >= totalPages ? '0.4' : '1';
}

function goToPrevPage() {
    if (state.currentPage > 1) {
        executeSearch(state.currentQuery, state.currentPage - 1);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    }
}

function goToNextPage() {
    executeSearch(state.currentQuery, state.currentPage + 1);
    window.scrollTo({ top: 400, behavior: 'smooth' });
}

/* ==========================================================================
   Evidence Assessment Demo Rendering (Original Design Vision)
   ========================================================================== */
function renderDemoAssessments() {
    const selectorContainer = document.getElementById('demo-claim-selector');
    if (!selectorContainer || !DEMO_ASSESSMENTS) return;

    selectorContainer.innerHTML = DEMO_ASSESSMENTS.map((item, idx) => `
        <button class="demo-claim-pill ${idx === state.selectedDemoIndex ? 'active' : ''}" onclick="selectDemoClaim(${idx})">
            ${escapeHtml(item.claim.substring(0, 60))}...
        </button>
    `).join('');

    renderSelectedDemoDetail(state.selectedDemoIndex);
}

function selectDemoClaim(index) {
    state.selectedDemoIndex = index;
    
    // Update pills active status
    const pills = document.querySelectorAll('.demo-claim-pill');
    pills.forEach((p, idx) => {
        p.classList.toggle('active', idx === index);
    });

    renderSelectedDemoDetail(index);
}

function renderSelectedDemoDetail(index) {
    const data = DEMO_ASSESSMENTS[index];
    const container = document.getElementById('demo-assessment-detail-container');
    if (!data || !container) return;

    const { supports, contradicts, inconclusive } = data.statusSummary;

    container.innerHTML = `
        <div class="claim-assessment-card glass">
            <div class="claim-core-box">
                <div class="claim-label">Extracted Scientific Hypothesis / Claim</div>
                <div class="claim-quote">"${escapeHtml(data.claim)}"</div>
            </div>

            <!-- Consensus Bar Visualization -->
            <div class="consensus-wrapper">
                <div class="consensus-header">
                    <span>Evidence Stance Synthesis (${data.confidence})</span>
                    <span style="color: var(--accent-cyan);">${data.category}</span>
                </div>
                <div class="consensus-bar-track">
                    <div class="consensus-segment seg-supports" style="width: ${supports}%;" title="${supports}% Supporting studies"></div>
                    <div class="consensus-segment seg-contradicts" style="width: ${contradicts}%;" title="${contradicts}% Contradicting studies"></div>
                    <div class="consensus-segment seg-inconclusive" style="width: ${inconclusive}%;" title="${inconclusive}% Inconclusive studies"></div>
                </div>
                <div class="consensus-legend">
                    <div class="legend-item">
                        <span class="legend-dot" style="background: var(--success);"></span>
                        <span><strong>${supports}%</strong> Supports</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot" style="background: var(--danger);"></span>
                        <span><strong>${contradicts}%</strong> Contradicts</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot" style="background: var(--warning);"></span>
                        <span><strong>${inconclusive}%</strong> Inconclusive / Weakens</span>
                    </div>
                </div>
            </div>

            <div class="ai-synthesis-box">
                <strong>🤖 AI Evidence Consensus Synthesis:</strong> ${escapeHtml(data.aiSummary)}
            </div>
        </div>

        <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Classified Peer-Reviewed Studies (${data.evidencePapers.length})</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Simulated claim assessment preview</span>
        </div>

        <div class="papers-feed">
            ${data.evidencePapers.map(paper => renderDemoPaperCard(paper)).join('')}
        </div>
    `;
}

function renderDemoPaperCard(paper) {
    let stanceBadgeClass = 'stance-supports';
    let stanceIcon = '✅';
    if (paper.stance === 'CONTRADICTS') {
        stanceBadgeClass = 'stance-contradicts';
        stanceIcon = '❌';
    } else if (paper.stance === 'INCONCLUSIVE') {
        stanceBadgeClass = 'stance-inconclusive';
        stanceIcon = '⚠️';
    }

    return `
        <article class="paper-card glass">
            <div class="paper-header">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <span class="stance-badge ${stanceBadgeClass}">
                        <span>${stanceIcon}</span>
                        <span>${paper.stance}</span>
                    </span>
                    <span class="pill-badge pill-purple">${escapeHtml(paper.studyType)}</span>
                </div>
                <div class="paper-citations">
                    <span>${paper.citations} citations</span>
                </div>
            </div>

            <h3 class="paper-title" style="margin-top: 6px;">
                ${escapeHtml(paper.title)}
            </h3>

            <div class="paper-authors">
                ${escapeHtml(paper.authors)}
            </div>

            <div class="paper-journal-meta">
                <span class="paper-journal-name">${escapeHtml(paper.journal)}</span>
                <span class="meta-dot">&bull;</span>
                <span>Year: ${escapeHtml(paper.year)}</span>
                <span class="meta-dot">&bull;</span>
                <span class="doi-tag">DOI: ${escapeHtml(paper.doi)}</span>
            </div>

            <div class="stance-reason-box">
                <strong>Key Finding Alignment:</strong> ${escapeHtml(paper.stanceReason)}
            </div>

            <div class="paper-abstract-box" style="margin-top: 14px;">
                <div class="abstract-heading">Abstract Excerpt</div>
                <div class="abstract-text">${escapeHtml(paper.abstract)}</div>
            </div>

            <div class="paper-actions">
                <div class="actions-left">
                    <a href="${paper.sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                        View Europe PMC Entry &rarr;
                    </a>
                </div>
            </div>
        </article>
    `;
}

/* ==========================================================================
   Modals: Paper Details, Alignment Demo, and About
   ========================================================================== */
function openPaperDetailModal(index) {
    const paper = state.currentResults[index];
    if (!paper) return;
    state.selectedPaperForModal = paper;

    const modal = document.getElementById('paper-modal');
    const badges = document.getElementById('modal-badges');
    const content = document.getElementById('modal-content');
    const footer = document.getElementById('modal-footer');

    const title = cleanPaperTitle(paper.title || 'Untitled Publication');
    const authors = paper.authorString || 'Authors not listed';
    const journal = paper.journalTitle || paper.journalInfo?.journal?.title || 'Unknown Journal';
    const year = paper.pubYear || 'N/D';
    const doi = paper.doi;
    const pmid = paper.pmid;
    const pmcid = paper.pmcid;
    const isOpenAccess = paper.isOpenAccess === 'Y';
    const cleanAbstract = formatAbstractText(paper.abstractText || 'No abstract text supplied by publisher.');

    badges.innerHTML = `
        ${isOpenAccess ? '<span class="pill-badge pill-emerald">Open Access</span>' : ''}
        ${paper.pubType ? `<span class="pill-badge pill-purple">${escapeHtml(paper.pubType)}</span>` : ''}
        <span class="paper-citations">${paper.citedByCount || 0} citations</span>
    `;

    content.innerHTML = `
        <h2 style="font-family: var(--font-heading); font-size: 1.35rem; margin-bottom: 12px; line-height: 1.35;">${title}</h2>
        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">
            <strong>Authors:</strong> ${escapeHtml(authors)}
        </div>
        <div style="display: flex; gap: 10px; font-size: 0.84rem; color: var(--text-muted); margin-bottom: 18px; flex-wrap: wrap;">
            <span><strong>Journal:</strong> ${escapeHtml(journal)}</span>
            <span><strong>Year:</strong> ${escapeHtml(year)}</span>
            ${doi ? `<span><strong>DOI:</strong> <a href="https://doi.org/${encodeURIComponent(doi)}" target="_blank" style="color: var(--primary);">${escapeHtml(doi)}</a></span>` : ''}
            ${pmid ? `<span><strong>PMID:</strong> ${escapeHtml(pmid)}</span>` : ''}
            ${pmcid ? `<span><strong>PMCID:</strong> ${escapeHtml(pmcid)}</span>` : ''}
        </div>

        <div class="paper-abstract-box" style="margin-bottom: 20px;">
            <div class="abstract-heading">Full Abstract (Europe PMC)</div>
            <div class="abstract-text" style="max-height: 250px; overflow-y: auto;">${cleanAbstract}</div>
        </div>

        <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <div style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; color: var(--text-muted);">
                Citation Exporters
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-sm btn-subtle" onclick="copyCitationAPA(${index})">Copy APA Reference</button>
                <button class="btn btn-sm btn-subtle" onclick="copyCitationBibTeX(${index})">Copy BibTeX Format</button>
            </div>
        </div>
    `;

    const sourceUrl = `https://europepmc.org/article/${paper.source || 'MED'}/${paper.id}`;
    footer.innerHTML = `
        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            Open in Europe PMC
        </a>
        <button class="btn btn-outline btn-sm" onclick="closePaperModal()">Close</button>
    `;

    modal.classList.add('active');
}

function closePaperModal() {
    const modal = document.getElementById('paper-modal');
    modal.classList.remove('active');
}

function openAlignmentModal(index) {
    const paper = state.currentResults[index];
    if (!paper) return;

    const modal = document.getElementById('paper-modal');
    const badges = document.getElementById('modal-badges');
    const content = document.getElementById('modal-content');
    const footer = document.getElementById('modal-footer');

    const userClaim = state.currentQuery || 'User scientific hypothesis';
    const title = cleanPaperTitle(paper.title || 'Untitled Publication');

    badges.innerHTML = `
        <span class="pill-badge pill-cyan">Evidence Assessment Preview</span>
    `;

    content.innerHTML = `
        <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid var(--border-active); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--accent-cyan); font-weight: 700; margin-bottom: 4px;">Target Claim to Verify:</div>
            <div style="font-size: 1.05rem; font-weight: 600;">"${escapeHtml(userClaim)}"</div>
        </div>

        <h3 style="font-family: var(--font-heading); font-size: 1.15rem; margin-bottom: 8px;">Paper Under Review:</h3>
        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 16px;">${title}</p>

        <div class="prototype-banner glass" style="margin: 16px 0;">
            <div class="banner-icon">🤖</div>
            <div class="banner-content">
                <div class="banner-heading">AI Reasoning Pipeline (Next Release Feature)</div>
                <div class="banner-text">
                    PaperTrail is currently in its <strong>paper discovery demo</strong> phase. In the complete version, 
                    our inference engine will parse this paper's methodology, sample size (n), and abstract outcomes 
                    to render an automated stance:
                    <div style="margin-top: 10px; display: flex; gap: 8px;">
                        <span class="stance-badge stance-supports">Supports</span>
                        <span class="stance-badge stance-contradicts">Contradicts</span>
                        <span class="stance-badge stance-inconclusive">Inconclusive</span>
                    </div>
                </div>
            </div>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-muted); line-height: 1.5;">
            You can immediately inspect the actual abstract and full text on Europe PMC or explore our curated claims in the 
            <strong>Evidence Assessments Demo</strong> tab to see full evidence breakdowns in action.
        </p>
    `;

    footer.innerHTML = `
        <button class="btn btn-outline btn-sm" onclick="closePaperModal()">Close Preview</button>
        <button class="btn btn-primary btn-sm" onclick="closePaperModal(); switchMainTab('demo');">View Full Demo Claims</button>
    `;

    modal.classList.add('active');
}

function openAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.add('active');
}

function closeAboutModal() {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('active');
}

function closeModalOnOverlay(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
}

/* ==========================================================================
   Citation Utilities (APA & BibTeX)
   ========================================================================== */
function copyCitationAPA(index) {
    const paper = state.currentResults[index];
    if (!paper) return;

    const title = cleanPaperTitle(paper.title || 'Untitled');
    const authors = paper.authorString ? paper.authorString.replace(/\.$/, '') : 'Anonymous';
    const year = paper.pubYear || 'n.d.';
    const journal = paper.journalTitle || 'Europe PMC';
    const doiPart = paper.doi ? ` https://doi.org/${paper.doi}` : '';

    const apa = `${authors} (${year}). ${title}. ${journal}.${doiPart}`;
    copyToClipboard(apa, 'APA Citation copied to clipboard!');
}

function copyCitationBibTeX(index) {
    const paper = state.currentResults[index];
    if (!paper) return;

    const key = (paper.authorString ? paper.authorString.split(' ')[0].replace(/[^a-zA-Z]/g, '') : 'Paper') + (paper.pubYear || '2026');
    const title = cleanPaperTitle(paper.title || 'Untitled');
    const authors = paper.authorString || 'Unknown';
    const journal = paper.journalTitle || 'Europe PMC';
    const year = paper.pubYear || '2026';
    const doi = paper.doi ? `,\n  doi = {${paper.doi}}` : '';

    const bibtex = `@article{${key},\n  title = {${title}},\n  author = {${authors}},\n  journal = {${journal}},\n  year = {${year}}${doi}\n}`;
    copyToClipboard(bibtex, 'BibTeX reference copied to clipboard!');
}

function exportResultsBibTeX() {
    if (!state.currentResults || state.currentResults.length === 0) {
        showToast('No results to export.');
        return;
    }

    const bibtexEntries = state.currentResults.map((paper, idx) => {
        const key = (paper.authorString ? paper.authorString.split(' ')[0].replace(/[^a-zA-Z]/g, '') : `Paper${idx}`) + (paper.pubYear || '2026');
        const title = cleanPaperTitle(paper.title || 'Untitled');
        const authors = paper.authorString || 'Unknown';
        const journal = paper.journalTitle || 'Europe PMC';
        const year = paper.pubYear || '2026';
        const doi = paper.doi ? `,\n  doi = {${paper.doi}}` : '';
        return `@article{${key},\n  title = {${title}},\n  author = {${authors}},\n  journal = {${journal}},\n  year = {${year}}${doi}\n}`;
    }).join('\n\n');

    downloadFile(bibtexEntries, `papertrail-${Date.now()}.bib`, 'text/plain');
    showToast('BibTeX file downloaded!');
}

function copyCurrentSearchUrl() {
    if (!state.currentQuery) {
        showToast('Perform a search first before sharing.');
        return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('q', state.currentQuery);
    copyToClipboard(url.toString(), 'Shareable search link copied!');
}

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
        const input = document.getElementById('claim-search-input');
        input.value = query;
        toggleClearButton();
        executeSearch(query, 1);
    }
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function cleanPaperTitle(title) {
    if (!title) return '';
    // Strip trailing period if duplicate and decode basic XML entities
    let cleaned = title.replace(/\.$/, '');
    cleaned = cleaned.replace(/&amp;/g, '&')
                     .replace(/&lt;/g, '<')
                     .replace(/&gt;/g, '>')
                     .replace(/&quot;/g, '"');
    return escapeHtml(cleaned);
}

function formatAbstractText(raw) {
    if (!raw) return '';
    // Replace XML header tags like <h4>Objective</h4> with bold headers
    let formatted = raw.replace(/<h4>(.*?)<\/h4>/gi, '<br><strong>$1:</strong> ')
                       .replace(/<b>(.*?)<\/b>/gi, '<strong>$1</strong>')
                       .replace(/<i>(.*?)<\/i>/gi, '<em>$1</em>');
    return formatted;
}

function truncateAuthors(authorString, maxAuthors = 4) {
    if (!authorString) return '';
    const parts = authorString.split(',');
    if (parts.length > maxAuthors) {
        return parts.slice(0, maxAuthors).join(',') + ' et al.';
    }
    return authorString;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(successMsg);
        }).catch(() => {
            fallbackCopy(text, successMsg);
        });
    } else {
        fallbackCopy(text, successMsg);
    }
}

function fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast(successMsg);
    } catch (e) {
        showToast('Failed to copy to clipboard.');
    }
    document.body.removeChild(ta);
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
}
