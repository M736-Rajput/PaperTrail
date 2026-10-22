# PaperTrail — Scientific Claim & Literature Discovery Engine

**PaperTrail** is a prototype designed to assist researchers, clinicians, and domain experts in checking scientific claims against published literature.

---

## 🔬 Core Capabilities

### 1. Live Europe PMC Paper Discovery (Real Literature)
- **Live Search**: Enter any research question or scientific hypothesis (e.g., *"Does intermittent fasting improve insulin sensitivity in humans?"*).
- **Public Database**: Directly queries the [Europe PMC REST API](https://europepmc.org/RestWebService) covering over 40 million peer-reviewed biomedical articles, clinical trials, and preprints.
- **Rich Paper Metadata**:
  - Full titles, author lists (with clean truncation and tooltips), and peer-reviewed journals.
  - Publication years, page info, DOIs, PMIDs, and PMCIDs.
  - Citation counts from Europe PMC citation indexes.
  - Open Access indicators and direct links to publisher DOIs and PDF full texts.
- **Abstract Explorer**:
  - Formatted abstract reader with structured subheadings (*Objective*, *Methods*, *Results*, *Conclusions*).
  - Expand/collapse accordions for clean visual scanning.
- **Advanced Filters**:
  - Sort by Relevance, Most Cited (`CITED DESC`), or Newest (`P_PDATE_D DESC`).
  - Filter for Open Access only (`OPEN_ACCESS:y`).
  - Filter for Reviews & Meta-Analyses only (`PUB_TYPE:"Review"`).
  - Timeframe selector (All years, 2024–2026, Last 5 Years, Last 10 Years).
- **Citation Exporter**:
  - One-click copy for **APA** references.
  - One-click copy and bulk export for **BibTeX** (`.bib`).
  - Shareable query URL generator.

### 2. Evidence Assessment Demo (Original Design Vision)
- Clearly separated demo tab showcasing what the next AI reasoning phase of PaperTrail will look like:
  - **Claim Extraction**: Isolates testable atomic hypotheses from natural language queries.
  - **Evidence Consensus Breakdown**: Interactive bar chart displaying the balance of evidence (**Supports**, **Contradicts**, **Inconclusive**).
  - **AI Consensus Summary**: High-level synthesis with study design weighting (e.g., RCTs vs. observational cohorts).
  - **Study Stance Badges**: Individual paper cards tagged with `[SUPPORTS]`, `[CONTRADICTS]`, and `[INCONCLUSIVE]` alongside key rationale and sample sizes ($n$).

---

## 🚀 How to Run Locally

### Option 1: Using Python
From the `Paper trail` directory:
```bash
python -m http.server 8080
```
Then visit [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Using Node.js
```bash
npx serve .
```

### Option 3: Direct File Opening
Double-click `index.html` to open directly in any modern browser.

---

## 📁 File Structure
- `index.html`: Modern semantic HTML structure with navigation tabs, glassmorphic search console, results feed, and modals.
- `styles.css`: Dark/Light theme system, typography (Inter, Outfit, JetBrains Mono), glassmorphism styling, and responsive layout.
- `app.js`: Client-side search engine, Europe PMC API integration, abstract parsing, citation generation, and modal management.
- `demoData.js`: Curated scientific claim assessments and suggested queries illustrating the original AI stance design.
