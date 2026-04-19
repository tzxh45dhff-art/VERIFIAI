"""
VerifAI — Usage tracking router.
"""
from fastapi import APIRouter
from models.schemas import UsageResponse
from models.database import get_all_usage

router = APIRouter(prefix="/api/usage", tags=["usage"])


@router.get("/", response_model=UsageResponse)
def get_usage(user_id: str = "demo-user", plan: str = "free"):
    """Get current usage for a user."""
    return get_all_usage(user_id, plan)
