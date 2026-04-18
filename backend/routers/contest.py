from fastapi import APIRouter, HTTPException
from models.schemas import ReevalRequest, ReevalResult, DeltaItem
from services import claude_service
import os, uuid
from datetime import datetime

router = APIRouter(prefix="/api/contest", tags=["contest"])

MOCK_REEVAL = {
    "delta_items": [
        {
            "field": "Years in Business",
            "old_value": "< 1 Year (Hallucinated)",
            "new_value": "3 Years (Verified)",
            "old_risk_contribution": 35,
            "new_risk_contribution": 11,
            "delta": -24,
            "explanation": "Correcting from <1 year to 3 years moves applicant past the 2-year minimum threshold, significantly reducing tenure risk.",
        }
    ],
    "old_total_score": 85,
    "new_total_score": 32,
    "old_decision": "DENIED",
    "new_decision": "APPROVED",
    "decision_flipped": True,
    "supervisor_note": (
        "After reviewing the counter-evidence submitted by the applicant, it is clear the automated "
        "underwriting system made a critical factual error regarding the applicant's revenue history. "
        "GreenLeaf AgriTech has 3 verified years of operation, which satisfies our tenure requirements. "
        "With a credit score of 710 and $150k annual revenue, the corrected risk profile supports approval."
    ),
    "confidence": 0.94,
}


@router.post("/reevaluate", response_model=ReevalResult)
def reevaluate(request: ReevalRequest):
    """Re-evaluate loan decision with counter-evidence using Claude."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        items = [DeltaItem(**d) for d in MOCK_REEVAL["delta_items"]]
        return ReevalResult(
            case_id=f"CASE-{uuid.uuid4().hex[:8].upper()}",
            delta_items=items,
            old_total_score=MOCK_REEVAL["old_total_score"],
            new_total_score=MOCK_REEVAL["new_total_score"],
            old_decision=MOCK_REEVAL["old_decision"],
            new_decision=MOCK_REEVAL["new_decision"],
            decision_flipped=MOCK_REEVAL["decision_flipped"],
            supervisor_note=MOCK_REEVAL["supervisor_note"],
            confidence=MOCK_REEVAL["confidence"],
        )
    try:
        return claude_service.reeval_decision(
            request.application_data,
            request.original_letter,
            request.flagged_claims,
            request.counter_evidence,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
