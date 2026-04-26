"""Auth endpoint tests — updated for full auth system."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    res = await client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@mediverse.ai",
        "password": "SecurePass1!",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    # TokenResponse now includes user object
    assert data["user"]["email"] == "jane@mediverse.ai"
    assert data["user"]["role"] == "user"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {"name": "Dupe", "email": "dupe@mediverse.ai", "password": "SecurePass1!"}
    await client.post("/api/auth/register", json=payload)  # first
    res = await client.post("/api/auth/register", json=payload)  # duplicate
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    res = await client.post("/api/auth/register", json={
        "name": "Weak",
        "email": "weak@mediverse.ai",
        "password": "nodigits",  # no uppercase, no digit, no special char
    })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user):
    res = await client.post("/api/auth/login", json={
        "email": "test@mediverse.ai",
        "password": "TestPass1!",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@mediverse.ai"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user):
    res = await client.post("/api/auth/login", json={
        "email": "test@mediverse.ai",
        "password": "WrongPass9!",
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient, test_user):
    from tests.conftest import auth_headers
    res = await client.get("/api/auth/me", headers=auth_headers(test_user))
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test@mediverse.ai"


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    res = await client.get("/api/auth/me")
    assert res.status_code == 401  # missing bearer token → 401


@pytest.mark.asyncio
async def test_logout_authenticated(client: AsyncClient, test_user):
    from tests.conftest import auth_headers
    # Need refresh token — register and use the returned one
    reg = await client.post("/api/auth/register", json={
        "name": "Logout Test",
        "email": "logouttest@mediverse.ai",
        "password": "LogoutPass1!",
    })
    refresh_token = reg.json()["refresh_token"]
    access_token = reg.json()["access_token"]
    res = await client.post(
        "/api/auth/logout",
        json={"refresh_token": refresh_token},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert res.status_code == 200
    assert "logged out" in res.json()["message"].lower()


@pytest.mark.asyncio
async def test_forgot_password_always_succeeds(client: AsyncClient):
    """Forgot password must return 200 even for non-existent emails (anti-enumeration)."""
    res = await client.post("/api/auth/forgot-password", json={
        "email": "nonexistent@mediverse.ai"
    })
    assert res.status_code == 200
    assert "sent" in res.json()["message"].lower()


@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    res = await client.post("/api/auth/reset-password", json={
        "token": "invalid-token-that-does-not-exist",
        "new_password": "NewSecure1!",
    })
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_verify_email_invalid_token(client: AsyncClient):
    res = await client.post("/api/auth/verify-email", json={
        "token": "bad-verify-token"
    })
    assert res.status_code == 400
