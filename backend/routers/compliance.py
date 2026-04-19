"""
VerifAI — Compliance router.
PDF passport generation and narrative endpoints.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from services.pdf_service import generate_compliance_passport, REPORTLAB_AVAILABLE
from services.groq_service import groq_service
from services.audit_service import MOCK_CLAIMS, MOCK_SUMMARY
from loguru import logger
import json
import io

router = APIRouter(prefix="/api/compliance", tags=["compliance"])


@router.post("/passport")
async def generate_passport(case_data: dict):
    """Generate and return a PDF compliance passport."""
    if not REPORTLAB_AVAILABLE:
        raise HTTPException(status_code=503, detail={
            "error": "service_unavailable",
            "message": "PDF generation library not available. Install reportlab.",
        })

    try:
        pdf_bytes = generate_compliance_passport(case_data)
        case_id = case_data.get("case_id", "CASE-UNKNOWN")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="VerifAI_Passport_{case_id}.pdf"',
            },
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail={
            "error": "pdf_generation_failed",
            "message": f"Could not generate PDF: {str(e)}",
        })


@router.post("/supervisor-memo-stream")
async def stream_supervisor_memo(case_data: dict):
    """Stream a supervisor review memo via SSE."""
    if not groq_service.available:
        mock_memo = (
            "Upon review of contested evidence for this case, the initial rejection was "
            "materially influenced by a hallucinated data point. With corrected data verified "
            "against the applicant's records, the risk profile falls within standard approval "
            "parameters. Decision hereby reversed, subject to standard conditions."
        )
        async def mock_stream():
            for word in mock_memo.split(" "):
                yield f"data: {json.dumps({'token': word + ' '})}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(mock_stream(), media_type="text/event-stream")

    system = """You are a Senior Loan Review Supervisor writing a formal memo.
Based on the case data provided, write a 3-4 sentence memo that:
1. Acknowledges what went wrong in the original AI decision
2. States what was corrected based on evidence
3. Announces the new decision with any conditions
Be professional and specific. Reference actual data points."""

    user = f"Case Data:\n{json.dumps(case_data, indent=2)}"

    async def generate():
        try:
            for token in groq_service.stream(
                system, user,
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=400,
            ):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Memo stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
