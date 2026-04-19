// All TypeScript interfaces for VerifAI

export interface ApplicationData {
  application_id: string;
  name: string;
  business: string;
  type: string;
  location: string;
  zip_code: string;
  zip_type: "urban" | "suburban" | "semi-urban" | "rural";
  industry: string;
  annual_revenue: number;
  years_in_business: number;
  employees: number;
  credit_score: number;
  loan_requested: number;
  collateral: string;
  purpose: string;
}

export type ClaimClassification = "VERIFIED" | "UNVERIFIED" | "HALLUCINATION" | "WEB_VERIFIED" | "WEB_CONTRADICTED";

export interface AuditClaim {
  id: string;
  text: string;
  classification: ClaimClassification;
  confidence: number;
  source_field: string | null;
  source_value: string | null;
  letter_value?: string;
  explanation: string;
  search_query?: string | null;
  source_url?: string;
  evidence_snippet?: string;
}

export interface AuditSummary {
  verified_count: number;
  unverified_count: number;
  hallucination_count: number;
  overall_reliability_score: number;
  verdict: "PASS" | "WARN" | "FAIL";
}

export interface AuditResult {
  case_id: string;
  claims: AuditClaim[];
  summary: AuditSummary;
  audited_at: string;
}

export interface BiasFlag {
  id: string;
  slice_name: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  stat: string;
  disparate_impact_ratio: number;
  chi_square_p_value: string;
  explanation: string;
  sample_size?: number;
}

export interface RegionStat {
  region: string;
  approval_rate: number;
  count: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
}

export interface IndustryStat {
  industry: string;
  approval_rate: number;
  applications: number;
  risk_level: "HIGH" | "MEDIUM" | "LOW";
}

export interface BiasReport {
  total_records: number;
  overall_approval_rate: number;
  dataset_name: string;
  region_stats: RegionStat[];
  industry_stats: IndustryStat[];
  bias_flags: BiasFlag[];
}

export interface ContestItem {
  claim_id: string;
  claim_text: string;
  counter_evidence_text: string;
  attachment_url?: string;
}

export interface DeltaItem {
  field: string;
  old_value: string;
  new_value: string;
  old_risk_contribution: number;
  new_risk_contribution: number;
  delta: number;
  explanation: string;
}

export interface ReevalResult {
  case_id: string;
  delta_items: DeltaItem[];
  old_total_score: number;
  new_total_score: number;
  threshold: number;
  old_decision: string;
  new_decision: string;
  decision_flipped: boolean;
  confidence: number;
  supervisor_note: string;
  conditions?: string[];
  evaluated_at: string;
}
