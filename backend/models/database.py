"""
VerifAI — SQLModel database tables + usage tracking.
SQLite-backed for demo; swap connection string for production Postgres.
"""
from sqlmodel import SQLModel, Field, Session, create_engine, select
from typing import Optional
from datetime import datetime, date
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./verifai.db")

engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


# ─── Tables ─────────────────────────────────────────────────────────

class UsageRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    action_type: str  # "bias", "audit", "contest", "chat"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    month_year: str = Field(default="")  # "2026-04" for monthly grouping
    day_date: str = Field(default="")    # "2026-04-19" for daily chat limit


class CaseRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: str = Field(index=True, unique=True)
    user_id: str = Field(index=True)
    applicant_name: str
    business: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    original_decision: str = "DENIED"
    final_decision: str = "DENIED"
    flipped: bool = False
    reliability_score: int = 0
    hallucination_count: int = 0
    bias_flags_count: int = 0
    letter_text: str = ""
    audit_result_json: str = ""    # JSON string
    reeval_result_json: str = ""   # JSON string


# ─── Init ────────────────────────────────────────────────────────────

def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


# ─── Usage helpers ───────────────────────────────────────────────────

FREE_PLAN_LIMITS = {
    "bias": 3,
    "audit": 5,
    "contest": 2,
    "chat": 10,  # per day, not month
}


def record_usage(user_id: str, action_type: str):
    """Record a usage event."""
    now = datetime.utcnow()
    record = UsageRecord(
        user_id=user_id,
        action_type=action_type,
        timestamp=now,
        month_year=now.strftime("%Y-%m"),
        day_date=now.strftime("%Y-%m-%d"),
    )
    with Session(engine) as session:
        session.add(record)
        session.commit()


def get_monthly_usage(user_id: str, action_type: str) -> int:
    month = datetime.utcnow().strftime("%Y-%m")
    with Session(engine) as session:
        records = session.exec(
            select(UsageRecord).where(
                UsageRecord.user_id == user_id,
                UsageRecord.action_type == action_type,
                UsageRecord.month_year == month,
            )
        ).all()
        return len(records)


def get_daily_usage(user_id: str, action_type: str) -> int:
    today = datetime.utcnow().strftime("%Y-%m-%d")
    with Session(engine) as session:
        records = session.exec(
            select(UsageRecord).where(
                UsageRecord.user_id == user_id,
                UsageRecord.action_type == action_type,
                UsageRecord.day_date == today,
            )
        ).all()
        return len(records)


def check_usage_limit(user_id: str, plan: str, action: str) -> tuple:
    """Returns (allowed, current_usage, limit)"""
    if plan != "free":
        return True, 0, -1  # unlimited for paid

    limit = FREE_PLAN_LIMITS.get(action, 999)

    if action == "chat":
        current = get_daily_usage(user_id, action)
    else:
        current = get_monthly_usage(user_id, action)

    return current < limit, current, limit


def get_all_usage(user_id: str, plan: str = "free") -> dict:
    """Get usage summary for all action types."""
    return {
        "bias": {"used": get_monthly_usage(user_id, "bias"), "limit": FREE_PLAN_LIMITS["bias"]},
        "audit": {"used": get_monthly_usage(user_id, "audit"), "limit": FREE_PLAN_LIMITS["audit"]},
        "contest": {"used": get_monthly_usage(user_id, "contest"), "limit": FREE_PLAN_LIMITS["contest"]},
        "chat": {"used": get_daily_usage(user_id, "chat"), "limit": FREE_PLAN_LIMITS["chat"]},
        "plan": plan,
    }
