"""
VerifAI — Central configuration via pydantic-settings.
Loads from .env automatically.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # AI
    GROQ_API_KEY: str = ""

    # Auth
    JWT_SECRET: str = "verifai_jwt_secret_change_me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    # Server
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    MAX_FILE_SIZE_MB: int = 10

    # Free plan limits (per month, except chat which is per day)
    FREE_PLAN_MONTHLY_AUDITS: int = 5
    FREE_PLAN_MONTHLY_BIAS: int = 3
    FREE_PLAN_MONTHLY_CONTEST: int = 2
    FREE_PLAN_DAILY_CHAT: int = 10

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
