// ============================================================
// VerifiAI — Mock Data Layer
// All deterministic. No LLM needed for the core demo flow.
// ============================================================

// ---- Feature 1: Bias Cartography (Training‑data stats) ----

export const trainingDataStats = {
  totalLoans: 10000,
  approvalRate: 64.2,

  regionBreakdown: [
    { region: "Urban Metro", applications: 4200, approved: 3150, pct: 42 },
    { region: "Suburban", applications: 3500, approved: 2400, pct: 35 },
    { region: "Semi‑Urban", applications: 1500, approved: 780, pct: 15 },
    { region: "Rural", applications: 800, approved: 90, pct: 8 },
  ],

  industryBreakdown: [
    { industry: "Fintech", count: 3100 },
    { industry: "Healthcare", count: 2400 },
    { industry: "Retail / E‑Com", count: 2200 },
    { industry: "Manufacturing", count: 1500 },
    { industry: "AgriTech / Rural Tech", count: 800 },
  ],

  biasFlags: [
    {
      id: "bf-1",
      title: "Rural Zip‑Code Bias",
      severity: "HIGH",
      stat: "Only 3.2% of approved loans belong to Rural zip codes.",
      detail:
        "Despite 8% of total applications originating from rural areas, the approval rate is 11.3% vs. the overall 64.2%. The model has insufficient positive‑class representation for rural applicants.",
    },
    {
      id: "bf-2",
      title: "AgriTech Industry Under‑representation",
      severity: "MEDIUM",
      stat: "AgriTech / Rural Tech accounts for 8% of applications but only 4.1% of approvals.",
      detail:
        "Feature importance analysis shows the model over‑indexes on 'industry_code' — a potential proxy variable for geography.",
    },
  ],
};

// ---- Feature 2: Hallucination Audit (Applicant + AI letter) ----

export interface Claim {
  id: string;
  text: string;
  status: "green" | "yellow" | "red";
  sourceField: string | null;
  sourceValue: string | null;
  reason: string | null;
}

export const applicantProfile = {
  id: "APP-7842",
  name: "Aarav Sharma",
  businessName: "GreenLeaf AgriTech",
  type: "Rural Tech Startup",
  location: "Jaipur, Rajasthan (Rural Zip 302021)",
  annualRevenue: "$150,000",
  yearsInBusiness: 3,
  employees: 8,
  creditScore: 710,
  loanRequested: "$250,000",
};

export const rejectionLetter = `Dear Mr. Sharma,

Thank you for your application for a Small Business Loan of $250,000 for GreenLeaf AgriTech.

After careful review, we regret to inform you that your application has been denied.

Applicant is a tech startup operating in the agricultural sector. Market conditions for tech startups are volatile and present elevated default risk. Our records indicate the applicant has less than 1 year of revenue history, which does not meet our minimum threshold of 2 years. Additionally, the requested loan amount of $250,000 exceeds typical approval ranges for businesses in rural zip codes.

We encourage you to reapply once your revenue history meets our requirements.

Sincerely,
Automated Underwriting Engine v3.1`;

export const auditClaims: Claim[] = [
  {
    id: "c1",
    text: "Applicant is a tech startup operating in the agricultural sector.",
    status: "green",
    sourceField: "type",
    sourceValue: "Rural Tech Startup",
    reason: null,
  },
  {
    id: "c2",
    text: "Market conditions for tech startups are volatile and present elevated default risk.",
    status: "yellow",
    sourceField: null,
    sourceValue: null,
    reason:
      "Generalization not present in applicant data. Plausible market commentary but not sourced from the application.",
  },
  {
    id: "c3",
    text: "the applicant has less than 1 year of revenue history",
    status: "red",
    sourceField: "yearsInBusiness",
    sourceValue: "3 Years",
    reason:
      "HALLUCINATION — Source data clearly states 3 years in business. The model fabricated '< 1 year'.",
  },
  {
    id: "c4",
    text: "the requested loan amount of $250,000 exceeds typical approval ranges for businesses in rural zip codes.",
    status: "yellow",
    sourceField: "loanRequested",
    sourceValue: "$250,000",
    reason:
      "Loan amount is accurate, but the 'typical approval range' threshold is an internal model parameter — not verifiable from applicant data alone.",
  },
];

// ---- Feature 3: Contestation Delta ----

export const deltaResult = {
  correctedField: "Years of Revenue History",
  originalValue: "< 1 Year (Hallucinated)",
  newValue: "3 Years (Verified)",
  oldScore: 85,
  newScore: 32,
  threshold: 50,
  oldDecision: "DENIED" as const,
  newDecision: "APPROVED" as const,
  explanation:
    "Correcting the revenue history from the hallucinated '< 1 year' to the verified '3 years' moved the applicant past the 2‑year minimum requirement. Combined with a credit score of 710 and $150k annual revenue, the risk score drops from 85 (High Risk) to 32 (Low Risk), crossing the approval threshold of 50.",
};

// ---- LLM System Prompts (documented for judges) ----

export const PROMPT_AUDITOR = `System: You are a strict, closed-book text-matching engine. Do not use outside knowledge. You will receive Source A (User Data) and Source B (AI Decision). For every claim in Source B, assign a label: [VERIFIED] if it perfectly matches Source A, [UNVERIFIED] if it is not in Source A but plausible, and [HALLUCINATION] if it contradicts Source A. Output strictly in JSON format.`;

export const PROMPT_DELTA = `System: You are a loan recalculation engine. The user has successfully contested a data point. Ingest the New Verified Evidence. Output the Explainable Delta showing exactly how the risk score changed based on the corrected data point, and output the final adjusted decision.`;
