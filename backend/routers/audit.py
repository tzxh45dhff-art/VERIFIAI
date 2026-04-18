from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import (
    ApplicationData, FactCheckRequest, AuditResult,
    AuditClaim, AuditSummary
)
from services import claude_service
import json
import asyncio

router = APIRouter(prefix="/api/audit", tags=["audit"])

# ── Mock fallback for demo when no API key ──────────────────────────
MOCK_LETTER = """Dear Mr. Sharma,

Thank you for submitting your loan application for GreenLeaf AgriTech (Application ID: APP-7842).

After careful review, Applicant is a tech startup operating in the agricultural technology sector. However, market conditions for tech startups are currently volatile, and sector-wide default rates are increasing.

Our records indicate the applicant has less than 1 year of revenue history, which does not satisfy our minimum underwriting threshold of 24 months. The requested loan of $250,000 exceeds typical approval ranges for businesses in rural zip codes.

Based on this assessment, your application has been DENIED.

— Automated Underwriting Engine v3.1"""

MOCK_AUDIT = {
    "claims": [
        {"text": "Applicant is a tech startup operating in the agricultural technology sector.",
         "classification": "VERIFIED", "confidence": 0.98,
         "source_field": "type", "source_value": "Rural Tech Startup",
         "explanation": "Directly matches 'type' and 'industry' fields in source data."},
        {"text": "market conditions for tech startups are currently volatile, and sector-wide default rates are increasing.",
         "classification": "UNVERIFIED", "confidence": 0.72,
         "source_field": None, "source_value": None,
         "explanation": "General market assertion — not verifiable from applicant data."},
        {"text": "the applicant has less than 1 year of revenue history",
         "classification": "HALLUCINATION", "confidence": 0.99,
         "source_field": "years_in_business", "source_value": "3",
         "explanation": "Source data states 3 years in business — directly contradicts this claim."},
        {"text": "The requested loan of $250,000 exceeds typical approval ranges for businesses in rural zip codes.",
         "classification": "UNVERIFIED", "confidence": 0.65,
         "source_field": "loan_requested", "source_value": "250000",
         "explanation": "Loan amount is accurate but 'typical approval ranges' is an internal threshold not in source data."},
    ],
    "summary": {
        "verified_count": 1,
        "unverified_count": 2,
        "hallucination_count": 1,
        "overall_reliability_score": 34,
        "audit_verdict": "FAIL",
    }
}


@router.get("/demo-application")
def get_demo_application():
    """Return the pre-filled Aarav Sharma demo case."""
    return ApplicationData()


@router.post("/generate-letter")
async def generate_letter(app_data: ApplicationData):
    """Stream a Claude-generated rejection letter via SSE."""
    import os
    if not os.getenv("ANTHROPIC_API_KEY"):
        # Return mock letter as SSE
        async def mock_stream():
            for char in MOCK_LETTER:
                yield f"data: {json.dumps({'token': char})}\n\n"
                await asyncio.sleep(0.005)
            yield "data: [DONE]\n\n"
        return StreamingResponse(mock_stream(), media_type="text/event-stream")

    async def real_stream():
        try:
            async for token in claude_service.generate_rejection_letter(app_data):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(real_stream(), media_type="text/event-stream")


@router.post("/fact-check", response_model=AuditResult)
def fact_check(request: FactCheckRequest):
    """Run hallucination audit on the letter."""
    import os
    if not os.getenv("ANTHROPIC_API_KEY"):
        # Return deterministic mock
        claims = [
            AuditClaim(id=f"c{i+1}", **c)
            for i, c in enumerate(MOCK_AUDIT["claims"])
        ]
        summary = AuditSummary(**MOCK_AUDIT["summary"])
        from models.schemas import AuditResult as AR
        import uuid
        return AR(
            case_id=f"CASE-{uuid.uuid4().hex[:8].upper()}",
            claims=claims,
            summary=summary,
            letter_text=request.letter_text,
        )

    try:
        return claude_service.fact_check_letter(request.source_data, request.letter_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
