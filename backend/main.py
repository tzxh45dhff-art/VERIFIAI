import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import bias, audit, contest, history

load_dotenv()

app = FastAPI(
    title="VerifiAI API",
    description="AI accountability pipeline for high-stakes automated decisions",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bias.router)
app.include_router(audit.router)
app.include_router(contest.router)
app.include_router(history.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "anthropic_key_set": bool(os.getenv("ANTHROPIC_API_KEY")),
        "version": "2.0.0",
    }
