from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ─── Application Data ───────────────────────────────────────────────

class ApplicationData(BaseModel):
    application_id: str = "APP-7842"
    name: str = "Aarav Sharma"
    business: str = "GreenLeaf AgriTech"
    type: str = "Rural Tech Startup"
    location: str = "Jaipur, Rajasthan"
    zip_type: Literal["urban", "suburban", "semi-urban", "rural"] = "rural"
    zip_code: str = "302021"
    industry: str = "AgriTech"
    annual_revenue: int = 150000
    years_in_business: int = 3
    employees: int = 8
    credit_score: int = 710
    loan_requested: int = 250000
    collateral: str = "Farm equipment valued at ₹40L"
    purpose: str = "Irrigation automation system"


# ─── Bias Report ────────────────────────────────────────────────────

class RegionStat(BaseModel):
    region: str
    applications: int
    approved: int
    approval_rate: float
    disparate_impact: float
    risk_level: Literal["HIGH", "MEDIUM", "LOW"]

class IndustryStat(BaseModel):
    industry: str
    applications: int
    approved: int
    approval_rate: float
    risk_level: Literal["HIGH", "MEDIUM", "LOW"]

class BiasFlag(BaseModel):
    id: str
    category: str
    slice_name: str
    stat: str
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    disparate_impact_ratio: float
    chi_square_p_value: float
    explanation: str

class BiasReport(BaseModel):
    total_records: int
    overall_approval_rate: float
    region_stats: List[RegionStat]
    industry_stats: List[IndustryStat]
    bias_flags: List[BiasFlag]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Audit ──────────────────────────────────────────────────────────

class AuditClaim(BaseModel):
    id: str
    text: str
    classification: Literal["VERIFIED", "UNVERIFIED", "HALLUCINATION"]
    confidence: float
    source_field: Optional[str] = None
    source_value: Optional[str] = None
    explanation: str

class AuditSummary(BaseModel):
    verified_count: int
    unverified_count: int
    hallucination_count: int
    overall_reliability_score: int
    audit_verdict: Literal["PASS", "WARN", "FAIL"]

class AuditResult(BaseModel):
    case_id: str
    claims: List[AuditClaim]
    summary: AuditSummary
    letter_text: str
    audited_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Contestation ───────────────────────────────────────────────────

class ContestItem(BaseModel):
    claim_id: str
    claim_text: str
    counter_evidence_text: Optional[str] = None

class ContestSubmission(BaseModel):
    case_id: str
    application_data: ApplicationData
    original_letter: str
    contest_items: List[ContestItem]
    hallucination_claims: List[AuditClaim]


# ─── Re-evaluation Delta ────────────────────────────────────────────

class DeltaItem(BaseModel):
    field: str
    old_value: str
    new_value: str
    old_risk_contribution: int
    new_risk_contribution: int
    delta: int
    explanation: str

class ReevalResult(BaseModel):
    case_id: str
    delta_items: List[DeltaItem]
    old_total_score: int
    new_total_score: int
    threshold: int = 50
    old_decision: str
    new_decision: str
    decision_flipped: bool
    supervisor_note: str
    confidence: float
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── History ────────────────────────────────────────────────────────

class AuditCase(BaseModel):
    id: str
    applicant_name: str
    business: str
    date: str
    original_decision: str
    final_decision: str
    flipped: bool
    reliability_score: int
    hallucination_count: int
    bias_flags: int


# ─── Request Bodies ─────────────────────────────────────────────────

class FactCheckRequest(BaseModel):
    source_data: ApplicationData
    letter_text: str

class NarrativeRequest(BaseModel):
    bias_report: BiasReport

class ReevalRequest(BaseModel):
    case_id: str
    application_data: ApplicationData
    original_letter: str
    flagged_claims: List[AuditClaim]
    counter_evidence: List[ContestItem]
