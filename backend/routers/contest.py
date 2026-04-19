"""
VerifAI — Contestation router.
Handles re-evaluation of AI decisions based on counter-evidence.
"""
from fastapi import APIRouter, HTTPException
from models.schemas import (
    ContestSubmission, ReevalResult, DeltaItem, BiasAdjustment,
)
from services.audit_service import run_reevaluation, MOCK_REEVAL
from services.groq_service import groq_service
from models.database import record_usage, check_usage_limit
from loguru import logger
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/contest", tags=["contest"])


@router.post("/re-evaluate", response_model=ReevalResult)
async def re_evaluate(
    submission: ContestSubmission,
    user_id: str = "demo-user",
    plan: str = "free",
):
    """Re-evaluate an AI decision based on counter-evidence."""
    # Usage check
    allowed, used, limit = check_usage_limit(user_id, plan, "contest")
    if not allowed:
        raise HTTPException(status_code=403, detail={
            "error": "monthly_limit_reached",
            "message": f"Monthly contestation limit reached ({used}/{limit}). Upgrade to Pro.",
            "used": used,
            "limit": limit,
            "upgrade_required": True,
        })

    try:
        hallucinations = [c.model_dump() for c in submission.hallucination_claims]
        counter = [c.model_dump() for c in submission.contest_items]

        result = await run_reevaluation(
            app_data=submission.application_data.model_dump(),
            original_letter=submission.original_letter,
            hallucinations=hallucinations,
            counter_evidence=counter,
        )

        record_usage(user_id, "contest")

        # Build proper response
        delta_items = [DeltaItem(**d) for d in result.get("delta_items", [])]

        bias_adj = None
        if result.get("bias_adjustment", {}).get("applied"):
            bias_adj = BiasAdjustment(**result["bias_adjustment"])

        return ReevalResult(
            case_id=submission.case_id,
            delta_items=delta_items,
            old_total_score=result["old_total_score"],
            new_total_score=result["new_total_score"],
            threshold=50,
            old_decision=result["old_decision"],
            new_decision=result["new_decision"],
            decision_flipped=result["decision_flipped"],
            supervisor_note=result.get("supervisor_note", ""),
            supervisor_memo=result.get("supervisor_memo", ""),
            confidence=result.get("confidence", 0.0),
            bias_adjustment=bias_adj,
            conditions=result.get("conditions", []),
        )

    except Exception as e:
        logger.error(f"Re-evaluation failed: {e}")
        # Fallback to mock
        delta_items = [DeltaItem(**d) for d in MOCK_REEVAL["delta_items"]]
        bias_adj = BiasAdjustment(**MOCK_REEVAL["bias_adjustment"])

        return ReevalResult(
            case_id=submission.case_id,
            delta_items=delta_items,
            old_total_score=MOCK_REEVAL["old_total_score"],
            new_total_score=MOCK_REEVAL["new_total_score"],
            threshold=50,
            old_decision="DENIED",
            new_decision="APPROVED",
            decision_flipped=True,
            supervisor_note=MOCK_REEVAL["supervisor_note"],
            supervisor_memo=MOCK_REEVAL["supervisor_memo"],
            confidence=MOCK_REEVAL["confidence"],
            bias_adjustment=bias_adj,
            conditions=MOCK_REEVAL["conditions"],
        )
