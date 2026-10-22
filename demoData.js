/**
 * PaperTrail - Demo Data & Example Assessments
 * Illustrates the visionary AI evidence extraction and claim assessment design
 * alongside live Europe PMC search results.
 */

const PRESET_QUERIES = [
    {
        title: "Intermittent Fasting & Insulin",
        query: "Does intermittent fasting improve insulin sensitivity in humans?",
        category: "Metabolism",
        icon: "🧬",
        description: "Evaluates metabolic benefits and glycemic control across clinical trials."
    },
    {
        title: "Caffeine & Memory",
        query: "Caffeine intake enhances working memory consolidation in adults",
        category: "Neuroscience",
        icon: "☕",
        description: "Assesses psychostimulant impacts on hippocampal neuroplasticity."
    },
    {
        title: "Microplastics & Marine Life",
        query: "Microplastics cause oxidative stress and toxicity in marine organisms",
        category: "Ecology",
        icon: "🌊",
        description: "Checks environmental toxicology literature on marine trophic webs."
    },
    {
        title: "Sleep Deprivation & Beta-Amyloid",
        query: "Chronic sleep deprivation accelerates beta-amyloid accumulation",
        category: "Neurology",
        icon: "🧠",
        description: "Investigates glymphatic clearance and neurodegenerative biomarkers."
    },
    {
        title: "mRNA Vaccine Durability",
        query: "mRNA vaccine booster durability against emerging viral variants",
        category: "Immunology",
        icon: "💉",
        description: "Tracks neutralizing antibody titers and memory B/T cell responses."
    },
    {
        title: "Mediterranean Diet & Longevity",
        query: "Adherence to Mediterranean diet reduces all-cause cardiovascular mortality",
        category: "Nutrition",
        icon: "🥗",
        description: "Synthesizes longitudinal cohort studies and meta-analyses."
    }
];

const DEMO_ASSESSMENTS = [
    {
        id: "claim-1",
        claim: "Intermittent fasting improves insulin sensitivity more effectively than continuous caloric restriction in overweight adults.",
        category: "Metabolism & Endocrinology",
        confidence: "Moderate Evidence",
        statusSummary: {
            supports: 54,
            contradicts: 28,
            inconclusive: 18
        },
        aiSummary: "Current clinical evidence indicates intermittent fasting significantly improves fasting insulin levels and HOMA-IR indices. However, randomized trials show comparable efficacy to isocaloric continuous energy restriction for overall glycemic control.",
        evidencePapers: [
            {
                id: "demo-p1",
                title: "Intermittent fasting versus continuous energy restriction for weight loss and glycemic control: A randomized controlled trial",
                authors: "Carter S, Clifton PM, Keogh JB",
                journal: "JAMA Network Open",
                year: "2024",
                doi: "10.1001/jamanetworkopen.2024.1234",
                citations: 184,
                stance: "SUPPORTS",
                stanceReason: "Observed a 1.2 mmol/L decrease in fasting glucose and a 28% increase in HOMA-IR sensitivity among the 5:2 fasting group over 12 months.",
                studyType: "Randomized Controlled Trial (n=137)",
                isOpenAccess: true,
                abstract: "Objective: To assess if 5:2 intermittent fasting produces superior insulin sensitivity improvements compared to daily energy restriction in participants with type 2 diabetes and obesity. Results showed significant improvements in HOMA-IR and reduction of glycosylated hemoglobin.",
                sourceUrl: "https://europepmc.org/article/MED/29987332"
            },
            {
                id: "demo-p2",
                title: "Comparative metabolic effects of time-restricted feeding without caloric deficit in healthy adults",
                authors: "Moro T, Tinsley G, Bianco A, et al.",
                journal: "Cell Metabolism",
                year: "2023",
                doi: "10.1016/j.cmet.2023.05.011",
                citations: 92,
                stance: "CONTRADICTS",
                stanceReason: "When calories were matched exactly and protein intake controlled, no statistically significant difference in insulin clamp sensitivity was detected.",
                studyType: "Crossover Intervention (n=34)",
                isOpenAccess: true,
                abstract: "We investigated whether 16/8 time-restricted feeding provides intrinsic metabolic advantages independent of negative caloric balance. Hyperinsulinemic-euglycemic clamps revealed insulin sensitivity remained identical between isocaloric groups.",
                sourceUrl: "https://europepmc.org/article/PMC/5064789"
            },
            {
                id: "demo-p3",
                title: "Circadian alignment and intermittent fasting: mechanisms of insulin action and beta-cell protection",
                authors: "Panda S, Longo VD, Mattson MP",
                journal: "Nature Reviews Endocrinology",
                year: "2025",
                doi: "10.1038/s41574-025-00892-x",
                citations: 310,
                stance: "SUPPORTS",
                stanceReason: "Mechanistic evidence demonstrating upregulation of SIRT1 and AMPK leading to GLUT4 translocation in skeletal muscle during fasting windows.",
                studyType: "Systematic Review & Meta-Synthesis",
                isOpenAccess: true,
                abstract: "Intermittent fasting cycles synchronize peripheral clocks with central suprachiasmatic oscillators, optimizing postprandial glucose disposal and attenuating systemic low-grade inflammation.",
                sourceUrl: "https://europepmc.org/article/MED/30413797"
            },
            {
                id: "demo-p4",
                title: "Long-term metabolic outcomes of alternate-day fasting in prediabetic cohorts: A 3-year follow-up",
                authors: "Trepanowski JF, Kroeger CM, Barnosky A, et al.",
                journal: "The Lancet Diabetes & Endocrinology",
                year: "2024",
                doi: "10.1016/S2213-8587(24)00112-9",
                citations: 145,
                stance: "INCONCLUSIVE",
                stanceReason: "High attrition rates (38%) and heterogeneous adherence confounded long-term statistical significance at year 3.",
                studyType: "Longitudinal Cohort Study (n=250)",
                isOpenAccess: false,
                abstract: "While initial 6-month markers showed promising insulin reduction, 36-month intention-to-treat analyses showed wide confidence intervals and no decisive divergence from standard lifestyle recommendations.",
                sourceUrl: "https://europepmc.org/article/MED/28682944"
            }
        ]
    },
    {
        id: "claim-2",
        claim: "Moderate daily caffeine consumption attenuates long-term cognitive decline and neuroinflammatory markers.",
        category: "Neuroscience & Aging",
        confidence: "Strong Evidence",
        statusSummary: {
            supports: 72,
            contradicts: 12,
            inconclusive: 16
        },
        aiSummary: "Epidemiological cohorts and preclinical rodent models consistently link adenosine A2A receptor antagonism by caffeine to reduced hippocampal microgliosis, tau phosphorylation, and preserved spatial memory.",
        evidencePapers: [
            {
                id: "demo-p5",
                title: "Adenosine A2A receptor blockade by caffeine mitigates neuroinflammation and behavioral deficits in irradiated mice",
                authors: "Borges MMS, Oliveira GM, Ferreira-Machado SC, et al.",
                journal: "International Journal of Radiation Biology",
                year: "2026",
                doi: "10.1080/09553002.2026.2728688",
                citations: 18,
                stance: "SUPPORTS",
                stanceReason: "Continuous caffeine intake decreased hippocampal TNF-alpha and GFAP reactive astrocytes while preserving object location memory.",
                studyType: "In Vivo Animal Model (Murine)",
                isOpenAccess: true,
                abstract: "Radiotherapy induces cognitive deficits and neuroinflammatory responses. Caffeine administered ad libitum preserved locomotor activity and reversed radiation-induced memory decline via A2A pathway modulation.",
                sourceUrl: "https://europepmc.org/article/MED/42715159"
            },
            {
                id: "demo-p6",
                title: "Prospective cohort analysis of habitual coffee consumption and incident Alzheimer's disease: 15-year results",
                authors: "Eskelinen MH, Ngandu T, Tuomilehto J, et al.",
                journal: "Journal of Alzheimer's Disease",
                year: "2023",
                doi: "10.3233/JAD-2023-1405",
                citations: 412,
                stance: "SUPPORTS",
                stanceReason: "3-5 cups per day was associated with a 65% decreased risk of dementia in late life compared to non-drinkers (HR: 0.35, 95% CI: 0.17-0.71).",
                studyType: "Prospective Cohort Study (n=1,409)",
                isOpenAccess: true,
                abstract: "In midlife, coffee drinking was evaluated in the CAIDE cohort. After 21 years of follow-up, moderate coffee drinkers showed the lowest risk of Alzheimer's disease and cognitive impairment.",
                sourceUrl: "https://europepmc.org/article/MED/19158424"
            },
            {
                id: "demo-p7",
                title: "Caffeine tolerance and acute sleep disruption: Negative impacts on memory consolidation in sleep-restricted adults",
                authors: "Banks S, Dinges DF, Van Dongen HP",
                journal: "Sleep Medicine Reviews",
                year: "2024",
                doi: "10.1016/j.smrv.2024.101789",
                citations: 74,
                stance: "CONTRADICTS",
                stanceReason: "High afternoon caffeine doses fragmented slow-wave sleep, impairing nocturnal hippocampal memory replay despite morning alertness.",
                studyType: "Double-Blind Lab Experiment (n=48)",
                isOpenAccess: false,
                abstract: "We assessed whether high chronic caffeine dosage compensates for cumulative sleep debt. While vigilance scores temporarily stabilized, polysomnography demonstrated marked delta power suppression.",
                sourceUrl: "https://europepmc.org/article/MED/26338421"
            }
        ]
    }
];
