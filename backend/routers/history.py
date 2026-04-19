"""
VerifAI — History router.
Returns case history from database or mock data.
"""
from fastapi import APIRouter
from models.schemas import AuditCase
from models.database import CaseRecord, Session, engine
from sqlmodel import select
from loguru import logger

router = APIRouter(prefix="/api/history", tags=["history"])

MOCK_CASES = [
    AuditCase(
        id="CASE-7842-A",
        applicant_name="Aarav Sharma",
        business="GreenLeaf AgriTech",
        date="2026-04-19",
        original_decision="DENIED",
        final_decision="APPROVED",
        flipped=True,
        reliability_score=34,
        hallucination_count=1,
        bias_flags=2,
    ),
    AuditCase(
        id="CASE-3921-B",
        applicant_name="Meera Iyer",
        business="CloudKitchen Express",
        date="2026-04-18",
        original_decision="DENIED",
        final_decision="DENIED",
        flipped=False,
        reliability_score=78,
        hallucination_count=0,
        bias_flags=0,
    ),
    AuditCase(
        id="CASE-5610-C",
        applicant_name="Rohan Kapoor",
        business="FinLedger Solutions",
        date="2026-04-17",
        original_decision="DENIED",
        final_decision="APPROVED",
        flipped=True,
        reliability_score=42,
        hallucination_count=2,
        bias_flags=1,
    ),
    AuditCase(
        id="CASE-8145-D",
        applicant_name="Ananya Das",
        business="EduBridge Academy",
        date="2026-04-16",
        original_decision="DENIED",
        final_decision="DENIED",
        flipped=False,
        reliability_score=91,
        hallucination_count=0,
        bias_flags=0,
    ),
]


@router.get("/cases")
def get_case_history(user_id: str = "demo-user"):
    """Get audit case history. Returns DB records or mock data."""
    try:
        with Session(engine) as session:
            records = session.exec(
                select(CaseRecord)
                .where(CaseRecord.user_id == user_id)
                .order_by(CaseRecord.created_at.desc())
                .limit(20)
            ).all()

            if records:
                return [
                    AuditCase(
                        id=r.case_id,
                        applicant_name=r.applicant_name,
                        business=r.business,
                        date=r.created_at.strftime("%Y-%m-%d"),
                        original_decision=r.original_decision,
                        final_decision=r.final_decision,
                        flipped=r.flipped,
                        reliability_score=r.reliability_score,
                        hallucination_count=r.hallucination_count,
                        bias_flags=r.bias_flags_count,
                    )
                    for r in records
                ]
    except Exception as e:
        logger.warning(f"DB read failed, using mock data: {e}")

    return MOCK_CASES


@router.get("/case/{case_id}")
def get_case_detail(case_id: str):
    """Get detailed case record."""
    try:
        with Session(engine) as session:
            record = session.exec(
                select(CaseRecord).where(CaseRecord.case_id == case_id)
            ).first()
            if record:
                return {
                    "case_id": record.case_id,
                    "applicant_name": record.applicant_name,
                    "business": record.business,
                    "created_at": record.created_at.isoformat(),
                    "original_decision": record.original_decision,
                    "final_decision": record.final_decision,
                    "flipped": record.flipped,
                    "reliability_score": record.reliability_score,
                    "letter_text": record.letter_text,
                }
    except Exception as e:
        logger.warning(f"Case detail lookup failed: {e}")

    # Mock fallback
    for c in MOCK_CASES:
        if c.id == case_id:
            return c.model_dump()

    return {"error": "case_not_found", "message": f"Case {case_id} not found"}
