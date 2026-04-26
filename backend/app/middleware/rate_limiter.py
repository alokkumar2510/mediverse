"""
Rate Limiter using slowapi.
Applies per-IP limits globally, with stricter limits on auth endpoints.
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from fastapi import FastAPI

from app.core.config import settings


# Module-level limiter instance — import this in routers to apply custom limits
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
    enabled=settings.RATE_LIMIT_ENABLED,
)


def add_rate_limiter(app: FastAPI) -> None:
    """Register the rate limiter and its error handler on the app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
