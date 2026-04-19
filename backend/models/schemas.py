"""
VerifAI — All Pydantic v2 request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Any
from datetime import datetime


# ─── Application Data ───────────────────────────────────────────────

class ApplicationData(BaseModel):
    application_id: str = "APP-7842"
    name: str = "Aarav Sharma"
    business: str = "GreenLeaf AgriTech"
    type: str = "Rural Tech Startup"
    location: str = "Jaipur, Rajasthan"
    zip_type: Literal["urban", "suburban", "semi-urban", "semi_urban", "rural"] = "rural"
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
    severity: Literal["SEVERE", "HIGH", "MEDIUM", "LOW"]
    disparate_impact_ratio: float
    chi_square_p_value: float
    explanation: str


class AttributeBiasResult(BaseModel):
    attribute: str
    risk_level: Literal["SEVERE", "HIGH", "MEDIUM", "LOW"]
    worst_dir: float
    chi2: float
    p_value: float
    p_significant: bool
    dof: int
    groups: List[dict]
    remediation: List[str]


class BiasReport(BaseModel):
    total_records: int
    overall_approval_rate: float
    region_stats: List[RegionStat] = []
    industry_stats: List[IndustryStat] = []
    bias_flags: List[BiasFlag] = []
    attributes: List[AttributeBiasResult] = []
    high_risk_demographics: List[str] = []
    dataset_summary: dict = {}
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Data Cleaning ──────────────────────────────────────────────────

class CleaningReport(BaseModel):
    original_rows: int
    clean_rows: int
    issues_fixed: List[str]
    outlier_columns: dict = {}


# ─── Audit ──────────────────────────────────────────────────────────

class AuditClaim(BaseModel):
    id: str
    text: str
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    classification: Literal["VERIFIED", "UNVERIFIED", "HALLUCINATION", "WEB_VERIFIED", "WEB_CONTRADICTED"]
    confidence: float
    source_field: Optional[str] = None
    source_value: Optional[str] = None
    letter_value: Optional[str] = None
    explanation: str
    search_query: Optional[str] = None
    web_confidence: Optional[float] = None
    web_evidence: Optional[str] = None
    web_source: Optional[str] = None


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


class BiasAdjustment(BaseModel):
    applied: bool = False
    demographic: Optional[str] = None
    dir_score: Optional[float] = None
    score_adjustment: Optional[int] = None
    reason: Optional[str] = None


class ReevalResult(BaseModel):
    case_id: str
    delta_items: List[DeltaItem]
    old_total_score: int
    new_total_score: int
    threshold: int = 50
    old_decision: str
    new_decision: str
    decision_flipped: bool
    supervisor_note: str = ""
    supervisor_memo: str = ""
    confidence: float
    bias_adjustment: Optional[BiasAdjustment] = None
    conditions: List[str] = []
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


# ─── Chatbot ────────────────────────────────────────────────────────

class ChatContext(BaseModel):
    current_page: str = "dashboard"
    case_id: Optional[str] = None
    applicant_name: Optional[str] = None
    audit_result: Optional[dict] = None
    bias_flags: Optional[List[dict]] = None
    user_plan: str = "free"
    step_completed: List[str] = []


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []
    context: ChatContext = ChatContext()
    user_id: str = "demo-user"


# ─── Request Bodies ─────────────────────────────────────────────────

class FactCheckRequest(BaseModel):
    source_data: ApplicationData = ApplicationData()
    letter_text: str


class NarrativeRequest(BaseModel):
    bias_report: BiasReport


class ReevalRequest(BaseModel):
    case_id: str
    application_data: ApplicationData = ApplicationData()
    original_letter: str
    flagged_claims: List[AuditClaim]
    counter_evidence: List[ContestItem]


class PassportRequest(BaseModel):
    case_id: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ─── Responses ──────────────────────────────────────────────────────

class UsageResponse(BaseModel):
    bias: dict = {"used": 0, "limit": 3}
    audit: dict = {"used": 0, "limit": 5}
    contest: dict = {"used": 0, "limit": 2}
    chat: dict = {"used": 0, "limit": 10}
    plan: str = "free"


class ErrorResponse(BaseModel):
    error: str
    message: str
    details: dict = {}
