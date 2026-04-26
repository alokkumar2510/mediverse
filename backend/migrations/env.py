"""
Alembic migrations environment.
Configured for async SQLAlchemy (asyncpg driver).
"""
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# ── Make sure all models are imported so Alembic sees their metadata ──────────
from app.models import Base  # noqa: F401 — registers all ORM tables
from app.core.config import settings

# Alembic Config object
config = context.config

# Logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata from our ORM
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run in 'offline' mode — output SQL without DB connection."""
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run in 'online' mode — connect and migrate."""
    connectable = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,  # single-use for migration
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
