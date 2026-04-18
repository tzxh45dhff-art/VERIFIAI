from fastapi import APIRouter
from models.schemas import AuditCase
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/history", tags=["history"])

# In-memory store for demo (replace with SQLModel + SQLite for production)
_MOCK_HISTORY: list[AuditCase] = [
    AuditCase(
        id="CASE-A1B2C3D4",
        applicant_name="Aarav Sharma",
        business="GreenLeaf AgriTech",
        date="2024-01-15",
        original_decision="DENIED",
        final_decision="APPROVED",
        flipped=True,
        reliability_score=34,
        hallucination_count=1,
        bias_flags=2,
    ),
    AuditCase(
        id="CASE-E5F6G7H8",
        applicant_name="Priya Mehta",
        business="TechRural Solutions",
        date="2024-01-12",
        original_decision="DENIED",
        final_decision="DENIED",
        flipped=False,
        reliability_score=71,
        hallucination_count=0,
        bias_flags=1,
    ),
    AuditCase(
        id="CASE-I9J0K1L2",
        applicant_name="Rohan Verma",
        business="AquaFarm Tech",
        date="2024-01-10",
        original_decision="DENIED",
        final_decision="APPROVED",
        flipped=True,
        reliability_score=28,
        hallucination_count=2,
        bias_flags=2,
    ),
]


@router.get("", response_model=list[AuditCase])
def get_history():
    return _MOCK_HISTORY


@router.post("/add")
def add_case(case: AuditCase):
    _MOCK_HISTORY.insert(0, case)
    return {"ok": True}
