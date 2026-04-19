"""
VerifAI — Bias analysis router.
Demo report, dataset upload with cleaning, and SSE narrative.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
from models.schemas import BiasReport, NarrativeRequest
from services.bias_service import compute_bias_report, analyze_uploaded_dataset
from services.data_cleaning_service import data_cleaning_service
from services.groq_service import groq_service
from models.database import record_usage, check_usage_limit
from loguru import logger
import pandas as pd
import json
import io

router = APIRouter(prefix="/api/bias", tags=["bias"])

_cached_report: BiasReport | None = None


NARRATIVE_SYSTEM = """You are an expert in AI fairness and regulatory compliance.
You have received a statistical bias analysis report.

Write a clear, professional narrative that:
1. Summarizes the key findings in plain English (1 paragraph)
2. Explains what each HIGH/MEDIUM RISK finding means practically for real people (1 paragraph per risk item)
3. States which regulations are implicated:
   - EU AI Act Article 10 (data governance requirements)
   - GDPR Article 22 (automated decision-making rights)
   - ECOA / Equal Credit Opportunity Act
4. Gives 3 prioritized remediation recommendations

Be specific. Reference the actual numbers from the report.
Do NOT use jargon without explaining it.
Do NOT say "it is important to note" or similar filler phrases.
Write as if explaining to a compliance officer preparing for audit.
Length: 350-450 words."""


MOCK_NARRATIVE = (
    "The dataset reveals a severe geographic bias against rural applicants. "
    "With an approval rate of only 11.3% compared to the 72% urban approval rate, "
    "rural applicants face a disparate impact ratio of 0.16 — far below the 0.8 legal threshold.\n\n"
    "This pattern is statistically significant (p < 0.001) and suggests the model has learned "
    "to penalize rural zip codes as a proxy for higher risk, regardless of individual creditworthiness. "
    "AgriTech businesses — predominantly rural — face compounding penalties.\n\n"
    "Recommended actions: (1) Oversample rural approved cases in retraining data, "
    "(2) Remove zip_type as a direct feature, (3) Audit geographic proxy variables, "
    "(4) Implement fairness constraints during model training."
)


@router.get("/report", response_model=BiasReport)
def get_bias_report():
    """Compute and return full bias statistics from demo dataset. Cached after first call."""
    global _cached_report
    if _cached_report is None:
        _cached_report = compute_bias_report()
    return _cached_report


@router.post("/analyze-dataset")
async def analyze_dataset(
    file: UploadFile = File(...),
    target_column: str = Form("approved"),
    protected_columns: str = Form("zip_type,industry,gender"),
    user_id: str = Form("demo-user"),
    plan: str = Form("free"),
):
    """Upload and analyze a CSV/JSON dataset for bias."""
    # Usage check
    allowed, used, limit = check_usage_limit(user_id, plan, "bias")
    if not allowed:
        raise HTTPException(status_code=403, detail={
            "error": "monthly_limit_reached",
            "message": f"Monthly bias analysis limit reached ({used}/{limit}). Upgrade to Pro.",
            "used": used,
            "limit": limit,
            "upgrade_required": True,
        })

    # Read file
    try:
        content = await file.read()
        filename = file.filename or "upload"

        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail={
                "error": "unsupported_format",
                "message": "Supported formats: CSV, JSON, XLSX",
            })
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=422, detail={
            "error": "file_parse_error",
            "message": f"Could not parse file: {str(e)}",
        })

    # Clean data
    cleaning_report, df_clean = data_cleaning_service.clean(df)

    # Parse protected columns
    cols = [c.strip() for c in protected_columns.split(",") if c.strip()]

    # Validate columns exist
    if target_column not in df_clean.columns:
        raise HTTPException(status_code=400, detail={
            "error": "invalid_target_column",
            "message": f"Column '{target_column}' not found. Available: {list(df_clean.columns)}",
        })

    # Analyze
    bias_report = analyze_uploaded_dataset(df_clean, target_column, cols)

    # Record usage
    record_usage(user_id, "bias")

    return {
        "cleaning": cleaning_report.model_dump(),
        "bias_report": bias_report.model_dump(),
    }


@router.post("/narrative")
async def get_bias_narrative(request: NarrativeRequest):
    """Generate plain-English bias narrative. SSE streaming when Groq available."""
    if not groq_service.available:
        return {"narrative": MOCK_NARRATIVE}

    report_json = request.bias_report.model_dump_json(indent=2)

    async def generate():
        try:
            for token in groq_service.stream(
                NARRATIVE_SYSTEM,
                f"Bias Analysis Report:\n{report_json}\n\nWrite the narrative.",
                model="llama-3.3-70b-versatile",
                temperature=0.3,
                max_tokens=1024,
            ):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Narrative streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
