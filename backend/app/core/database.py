"""
MediVerse AI — Async Database Engine & Session Factory
Uses SQLAlchemy 2.x with asyncpg driver and connection pooling.
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, MappedColumn
from sqlalchemy import MetaData

from app.core.config import settings

# ── Naming convention for Alembic auto-generate ───────────────────────────────
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

# ── Engine ────────────────────────────────────────────────────────────────────
def _engine_kwargs() -> dict:
    """Return extra engine kwargs — omit pool settings for SQLite (used in tests)."""
    url_lower = settings.DATABASE_URL.lower()
    if url_lower.startswith("sqlite"):
        return {}
    return {
        "pool_pre_ping": True,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": 3600,
        "connect_args": {
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
        },
    }


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    **_engine_kwargs(),
)

# ── Session factory ───────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,        # objects stay usable after commit
    autoflush=False,               # explicit flush for better control
)


# ── Declarative base with naming conventions ──────────────────────────────────
class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)


# ── Dependency injector ───────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields an async DB session.
    Rolls back on exception, always closes on exit.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
