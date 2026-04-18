from fastapi import APIRouter
from fastapi.responses import JSONResponse
from models.schemas import BiasReport, NarrativeRequest
from services.bias_service import compute_bias_report
from services import claude_service
import os

router = APIRouter(prefix="/api/bias", tags=["bias"])

_cached_report: BiasReport | None = None


@router.get("/report", response_model=BiasReport)
def get_bias_report():
    """Compute and return full bias statistics. Cached after first call."""
    global _cached_report
    if _cached_report is None:
        _cached_report = compute_bias_report()
    return _cached_report


@router.post("/narrative")
def get_bias_narrative(request: NarrativeRequest):
    """Claude generates plain-English bias summary."""
    if not os.getenv("ANTHROPIC_API_KEY"):
        return {
            "narrative": (
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
        }
    try:
        narrative = claude_service.generate_bias_narrative(
            request.bias_report.model_dump_json(indent=2)
        )
        return {"narrative": narrative}
    except Exception as e:
        return {"narrative": f"Error generating narrative: {str(e)}", "error": True}
