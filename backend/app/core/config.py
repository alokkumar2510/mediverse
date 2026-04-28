"""
MediVerse AI — Application Settings
All values driven by environment variables (.env or Azure App Settings).
"""
from functools import lru_cache
from typing import Any, List, Union
import json

from pydantic import field_validator, Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────────
    APP_NAME: str = "MediVerse AI"
    ENV: str = "development"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ── Database ──────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite+aiosqlite:///./mediverse.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    # ── Auth ──────────────────────────────────────────────────────────
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # ── Redis ─────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_ENABLED: bool = False

    # ── File Storage ──────────────────────────────────────────────────
    CLOUDINARY_URL: str = ""
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/bmp",
        "application/pdf",
    ]

    # ── URLs & CORS ───────────────────────────────────────────────────
    # Accepts JSON array string OR comma-separated string from Azure env vars
    FRONTEND_URL: str = "http://localhost:3000"
    API_URL: str = "http://localhost:8000"
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "https://mediverse.alokkumarsahu.in",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Any) -> List[str]:
        """Accept JSON array, comma-separated string, or list."""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            # Try JSON array first: ["https://...","https://..."]
            if v.startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Fall back to comma-separated
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return [str(v)]

    # ── Rate Limiting ─────────────────────────────────────────────────
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_AUTH_PER_MINUTE: int = 10

    # ── Admin ─────────────────────────────────────────────────────────
    ADMIN_EMAIL: str = ""

    # ── Feature flags ─────────────────────────────────────────────────
    ENABLE_DOCS: bool = True

    # ── NVIDIA NIM (Primary AI Provider) ──────────────────────────────
    NVIDIA_NIM_API_KEY: str = ""
    NIM_MODEL_TEXT: str = "meta/llama-3.1-70b-instruct"
    NIM_MODEL_VISION: str = "meta/llama-3.2-90b-vision-instruct"
    NIM_MAX_OUTPUT_TOKENS: int = 2048
    NIM_TEMPERATURE: float = 0.2
    NIM_TIMEOUT_SEC: float = 60.0
    NIM_MAX_RETRIES: int = 3
    NIM_RPM: int = 60

    # ── Secondary AI (Fallback / Deprecated) ─────────────────────────────
    SECONDARY_AI_API_KEY: str = Field(default="", validation_alias=AliasChoices("SECONDARY_AI_API_KEY", "GEMINI_API_KEY"))
    SECONDARY_AI_MODEL_TEXT: str = Field(default="gemini-2.5-flash", validation_alias=AliasChoices("SECONDARY_AI_MODEL_TEXT", "GEMINI_MODEL_TEXT"))
    SECONDARY_AI_MODEL_VISION: str = Field(default="gemini-2.5-flash", validation_alias=AliasChoices("SECONDARY_AI_MODEL_VISION", "GEMINI_MODEL_VISION"))
    SECONDARY_AI_MAX_OUTPUT_TOKENS: int = Field(default=2048, validation_alias=AliasChoices("SECONDARY_AI_MAX_OUTPUT_TOKENS", "GEMINI_MAX_OUTPUT_TOKENS"))
    SECONDARY_AI_TEMPERATURE: float = Field(default=0.2, validation_alias=AliasChoices("SECONDARY_AI_TEMPERATURE", "GEMINI_TEMPERATURE"))
    SECONDARY_AI_TIMEOUT_SEC: float = Field(default=30.0, validation_alias=AliasChoices("SECONDARY_AI_TIMEOUT_SEC", "GEMINI_TIMEOUT_SEC"))
    SECONDARY_AI_MAX_RETRIES: int = Field(default=3, validation_alias=AliasChoices("SECONDARY_AI_MAX_RETRIES", "GEMINI_MAX_RETRIES"))
    SECONDARY_AI_RPM: int = Field(default=15, validation_alias=AliasChoices("SECONDARY_AI_RPM", "GEMINI_RPM"))

    # ── Derived helpers ───────────────────────────────────────────────
    @property
    def nim_configured(self) -> bool:
        return bool(self.NVIDIA_NIM_API_KEY)

    @property
    def secondary_ai_configured(self) -> bool:
        return bool(self.SECONDARY_AI_API_KEY)

    @property
    def is_production(self) -> bool:
        return self.ENV == "production"

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.DATABASE_URL

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def docs_url(self) -> str | None:
        return "/api/docs" if self.ENABLE_DOCS else None

    @property
    def redoc_url(self) -> str | None:
        return "/api/redoc" if self.ENABLE_DOCS else None


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — safe to import anywhere."""
    return Settings()


# Module-level singleton for convenience
settings = get_settings()
