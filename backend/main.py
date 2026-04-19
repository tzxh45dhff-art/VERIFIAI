"""
VerifAI — FastAPI application entrypoint.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
from models.database import init_db
import sys
import os

# Configure loguru
logger.remove()
logger.add(sys.stderr, format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}", level="INFO")

# Init database
init_db()

# Create app
app = FastAPI(
    title="VerifAI API",
    description="AI Accountability & Hallucination Detection Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────
from routers.auth import router as auth_router
from routers.bias import router as bias_router
from routers.audit import router as audit_router
from routers.contest import router as contest_router
from routers.compliance import router as compliance_router
from routers.chatbot import router as chatbot_router
from routers.history import router as history_router
from routers.usage import router as usage_router

app.include_router(auth_router)
app.include_router(bias_router)
app.include_router(audit_router)
app.include_router(contest_router)
app.include_router(compliance_router)
app.include_router(chatbot_router)
app.include_router(history_router)
app.include_router(usage_router)


# ─── Root + Health ──────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "VerifAI API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/api/health")
def health_check():
    from services.groq_service import groq_service
    return {
        "status": "healthy",
        "service": "VerifAI API",
        "version": "1.0.0",
        "groq_available": groq_service.available,
        "features": {
            "bias_analysis": True,
            "hallucination_audit": True,
            "contestation": True,
            "pdf_passport": True,
            "chatbot": groq_service.available,
            "web_verification": groq_service.available,
        },
    }


# ─── Global exception handler ──────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred. Please try again.",
            "details": {"type": str(type(exc).__name__)},
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
