"""
VerifAI — Auth router. Simple JWT-based demo auth.
"""
from fastapi import APIRouter, HTTPException
from models.schemas import LoginRequest
from config import settings
from datetime import datetime, timedelta
from jose import jwt
from loguru import logger

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Demo users (replace with DB in production)
DEMO_USERS = {
    "demo@verifai.com": {
        "password": "demo123",
        "name": "Aarav Sharma",
        "plan": "free",
        "role": "analyst",
        "casesAnalyzed": 24,
        "hallucinationsFound": 89,
        "decisionsFlipped": 31,
    },
    "pro@verifai.com": {
        "password": "pro123",
        "name": "Priya Mehta",
        "plan": "pro",
        "role": "senior_analyst",
        "casesAnalyzed": 142,
        "hallucinationsFound": 367,
        "decisionsFlipped": 89,
    },
}


def create_token(email: str, user_data: dict) -> str:
    payload = {
        "sub": email,
        "name": user_data["name"],
        "plan": user_data["plan"],
        "role": user_data["role"],
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except Exception:
        return None


@router.post("/login")
def login(request: LoginRequest):
    """Authenticate and return JWT token."""
    user = DEMO_USERS.get(request.email)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail={
            "error": "invalid_credentials",
            "message": "Invalid email or password",
        })

    token = create_token(request.email, user)

    return {
        "token": token,
        "user": {
            "email": request.email,
            "name": user["name"],
            "plan": user["plan"],
            "role": user["role"],
            "casesAnalyzed": user["casesAnalyzed"],
            "hallucinationsFound": user["hallucinationsFound"],
            "decisionsFlipped": user["decisionsFlipped"],
        },
    }


@router.get("/me")
def get_current_user():
    """Return demo user info (no auth middleware for demo)."""
    return {
        "email": "demo@verifai.com",
        "name": "Aarav Sharma",
        "plan": "free",
        "role": "analyst",
        "casesAnalyzed": 24,
        "hallucinationsFound": 89,
        "decisionsFlipped": 31,
    }
