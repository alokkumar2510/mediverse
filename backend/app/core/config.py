"""
MediVerse AI — Application Settings
All values driven by environment variables (.env or Azure App Settings).
"""
from functools import lru_cache
from typing import Any, List, Union
import json

from pydantic import field_validator
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

    # ── Gemini AI (Temporary ML Bridge) ───────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_TEXT: str = "gemini-2.0-flash"
    GEMINI_MODEL_VISION: str = "gemini-2.0-flash"
    GEMINI_MAX_OUTPUT_TOKENS: int = 2048
    GEMINI_TEMPERATURE: float = 0.2
    GEMINI_TIMEOUT_SEC: float = 30.0
    GEMINI_MAX_RETRIES: int = 3
    GEMINI_RPM: int = 15

    # ── Derived helpers ───────────────────────────────────────────────
    @property
    def gemini_configured(self) -> bool:
        return bool(self.GEMINI_API_KEY)

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
