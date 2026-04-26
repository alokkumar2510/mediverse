"""
Pytest configuration and shared fixtures for MediVerse backend tests.
Uses an async in-memory SQLite database for speed.
"""
import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.security import create_access_token
from app.main import app
from app.models.user import User

# ── Use SQLite in-memory for tests (fast, no external service needed) ─────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest_asyncio.fixture(scope="session")
async def setup_db():
    """Create all tables once per test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db(setup_db) -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional session per test (rolled back after)."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTPX client with DB dependency overridden."""
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db: AsyncSession) -> User:
    """Create a standard user for authenticated tests."""
    from app.core.security import hash_password
    user = User(
        id=uuid.uuid4(),
        name="Test User",
        email="test@mediverse.ai",
        password_hash=hash_password("TestPass1!"),
        role="user",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


@pytest_asyncio.fixture
async def admin_user(db: AsyncSession) -> User:
    """Create an admin user for admin endpoint tests."""
    from app.core.security import hash_password
    user = User(
        id=uuid.uuid4(),
        name="Admin User",
        email="admin@mediverse.ai",
        password_hash=hash_password("AdminPass1!"),
        role="admin",
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    return user


def auth_headers(user: User) -> dict:
    """Return Authorization headers for a given user."""
    token = create_access_token(str(user.id), extra_claims={"role": user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def authed_client(db: AsyncSession, test_user: User) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTPX client pre-authenticated as test_user."""
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    headers = auth_headers(test_user)
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers=headers,
    ) as ac:
        yield ac
    app.dependency_overrides.clear()
