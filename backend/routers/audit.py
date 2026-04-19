"""
VerifAI — Audit router.
Fact-check letters, extract PDF text, generate letters, run Layer A+B.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from models.schemas import (
    ApplicationData, FactCheckRequest, AuditResult,
    AuditClaim, AuditSummary,
)
from services.audit_service import (
    run_layer_a, run_layer_b, generate_rejection_letter,
    stream_rejection_letter, MOCK_LETTER, MOCK_CLAIMS, MOCK_SUMMARY,
)
from services.groq_service import groq_service
from models.database import record_usage, check_usage_limit
from loguru import logger
import json
import uuid

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

router = APIRouter(prefix="/api/audit", tags=["audit"])


@router.post("/generate-letter")
async def generate_letter(app_data: ApplicationData):
    """Generate a rejection letter with intentional hallucination."""
    try:
        letter = await generate_rejection_letter(app_data.model_dump())
        return {"letter_text": letter}
    except Exception as e:
        logger.error(f"Letter generation failed: {e}")
        return {"letter_text": MOCK_LETTER}


@router.post("/generate-letter-stream")
async def generate_letter_stream(app_data: ApplicationData):
    """SSE stream a rejection letter."""
    gen = stream_rejection_letter(app_data.model_dump())

    if gen is None:
        # No API key — send mock as SSE
        async def mock_stream():
            for word in MOCK_LETTER.split(" "):
                yield f"data: {json.dumps({'token': word + ' '})}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(mock_stream(), media_type="text/event-stream")

    async def stream():
        try:
            for token in gen:
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Letter stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/fact-check")
async def fact_check_letter(
    request: FactCheckRequest,
    user_id: str = "demo-user",
    plan: str = "free",
):
    """Run Layer A closed-book audit on a letter."""
    # Usage check
    allowed, used, limit = check_usage_limit(user_id, plan, "audit")
    if not allowed:
        raise HTTPException(status_code=403, detail={
            "error": "monthly_limit_reached",
            "message": f"Monthly audit limit reached ({used}/{limit}). Upgrade to Pro.",
            "used": used,
            "limit": limit,
            "upgrade_required": True,
        })

    if not groq_service.available:
        # Return mock
        case_id = f"CASE-{uuid.uuid4().hex[:6].upper()}"
        claims = [AuditClaim(**c) for c in MOCK_CLAIMS]
        summary = AuditSummary(**MOCK_SUMMARY)
        record_usage(user_id, "audit")
        return AuditResult(
            case_id=case_id,
            claims=claims,
            summary=summary,
            letter_text=request.letter_text,
        )

    try:
        source_dict = request.source_data.model_dump()
        result = await run_layer_a(source_dict, request.letter_text)

        case_id = f"CASE-{uuid.uuid4().hex[:6].upper()}"
        claims = [AuditClaim(**c) for c in result.get("claims", [])]
        summary = AuditSummary(**result.get("summary", MOCK_SUMMARY))

        record_usage(user_id, "audit")

        return AuditResult(
            case_id=case_id,
            claims=claims,
            summary=summary,
            letter_text=request.letter_text,
        )
    except Exception as e:
        logger.error(f"Fact-check failed: {e}")
        raise HTTPException(status_code=500, detail={
            "error": "audit_failed",
            "message": f"Audit engine error: {str(e)}",
        })


@router.post("/fact-check-with-web")
async def fact_check_with_web(
    request: FactCheckRequest,
    user_id: str = "pro-user",
    plan: str = "pro",
):
    """Run Layer A + Layer B web verification. PRO only."""
    if plan != "pro":
        raise HTTPException(status_code=403, detail={
            "error": "pro_required",
            "message": "Web verification requires a Pro plan.",
        })

    if not groq_service.available:
        raise HTTPException(status_code=503, detail={
            "error": "ai_unavailable",
            "message": "AI engine is not configured. Set GROQ_API_KEY.",
        })

    source_dict = request.source_data.model_dump()

    # Layer A
    layer_a_result = await run_layer_a(source_dict, request.letter_text)
    claims = layer_a_result.get("claims", [])

    # Layer B
    claims = await run_layer_b(claims)

    # Recompute summary
    v = sum(1 for c in claims if c.get("classification") in ("VERIFIED", "WEB_VERIFIED"))
    u = sum(1 for c in claims if c.get("classification") in ("UNVERIFIED",))
    h = sum(1 for c in claims if c.get("classification") in ("HALLUCINATION", "WEB_CONTRADICTED"))
    total = len(claims)
    score = round(((v * 100 + u * 50) / (total * 100)) * 100) if total else 0
    verdict = "PASS" if score >= 80 else "WARN" if score >= 50 else "FAIL"

    case_id = f"CASE-{uuid.uuid4().hex[:6].upper()}"
    record_usage(user_id, "audit")

    return AuditResult(
        case_id=case_id,
        claims=[AuditClaim(**c) for c in claims],
        summary=AuditSummary(
            verified_count=v,
            unverified_count=u,
            hallucination_count=h,
            overall_reliability_score=score,
            audit_verdict=verdict,
        ),
        letter_text=request.letter_text,
    )


@router.post("/extract-pdf")
async def extract_pdf_text(file: UploadFile = File(...)):
    """Extract text from an uploaded PDF using PyMuPDF."""
    if not PYMUPDF_AVAILABLE:
        raise HTTPException(status_code=503, detail={
            "error": "service_unavailable",
            "message": "PDF extraction library not available.",
        })

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail={
            "error": "invalid_format",
            "message": "Only PDF files are supported.",
        })

    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()

        if not text.strip():
            raise HTTPException(status_code=422, detail={
                "error": "no_text_extracted",
                "message": "Could not extract text from PDF. The file may be image-based.",
            })

        return {
            "text": text.strip(),
            "pages": len(doc) if hasattr(doc, '__len__') else 0,
            "filename": file.filename,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=500, detail={
            "error": "extraction_failed",
            "message": f"PDF extraction error: {str(e)}",
        })
