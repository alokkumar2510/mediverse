"""
Auth router — /api/auth/*
All 8 endpoints: register, login, logout, refresh, me,
forgot-password, reset-password, verify-email.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.auth import (
    AuthUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import MessageResponse
from app.services import auth_service

router = APIRouter(tags=["Auth"])

DB = Annotated[AsyncSession, Depends(get_db)]


# ── POST /api/auth/register ───────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=201,
    summary="Register a new user account",
    description=(
        "Creates a new account and returns an access + refresh token pair. "
        "Password must be ≥8 chars with uppercase, digit, and special character."
    ),
)
async def register(
    body: RegisterRequest,
    request: Request,
    db: DB,
) -> TokenResponse:
    return await auth_service.register_user(db, body, request)


# ── POST /api/auth/login ──────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT token pair",
    description="Returns access token (15 min) + refresh token (30 days). Creates a session record.",
)
async def login(
    body: LoginRequest,
    request: Request,
    db: DB,
) -> TokenResponse:
    return await auth_service.login_user(db, body, request)


# ── POST /api/auth/refresh ────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate tokens using a valid refresh token",
    description=(
        "Validates the refresh token against the DB session. "
        "Old session is revoked, new token pair issued (rotation)."
    ),
)
async def refresh(
    body: RefreshRequest,
    request: Request,
    db: DB,
) -> TokenResponse:
    return await auth_service.refresh_tokens(db, body, request)


# ── POST /api/auth/logout ─────────────────────────────────────────────────────

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout — revoke current session",
    description=(
        "Revokes the DB session tied to the provided refresh token. "
        "Set logout_all=true to revoke all devices."
    ),
)
async def logout(
    body: LogoutRequest,
    current_user: CurrentUser,
    db: DB,
) -> MessageResponse:
    if body.logout_all:
        return await auth_service.logout_all_sessions(db, current_user.id)

    refresh_body = RefreshRequest(refresh_token=body.refresh_token or "")
    return await auth_service.logout_user(db, refresh_body)


# ── GET /api/auth/me ──────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=AuthUserResponse,
    summary="Get current authenticated user profile",
)
async def me(current_user: CurrentUser) -> AuthUserResponse:
    return await auth_service.get_me(current_user)


# ── POST /api/auth/forgot-password ───────────────────────────────────────────

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset email",
    description="Always returns success to prevent user enumeration attacks.",
)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: DB,
) -> MessageResponse:
    return await auth_service.forgot_password(db, body)


# ── POST /api/auth/reset-password ────────────────────────────────────────────

@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using a valid token from email",
    description="Token is valid for 1 hour. All sessions are revoked on success.",
)
async def reset_password(
    body: ResetPasswordRequest,
    db: DB,
) -> MessageResponse:
    return await auth_service.reset_password(db, body)


# ── POST /api/auth/verify-email ───────────────────────────────────────────────

@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verify email address using token from verification email",
    description="Token is valid for 24 hours.",
)
async def verify_email(
    body: VerifyEmailRequest,
    db: DB,
) -> MessageResponse:
    return await auth_service.verify_email(db, body)


# ── POST /api/auth/send-verification ──────────────────────────────────────────

@router.post(
    "/send-verification",
    response_model=MessageResponse,
    summary="Re-send email verification link to current user",
)
async def send_verification(
    current_user: CurrentUser,
    db: DB,
) -> MessageResponse:
    return await auth_service.send_verification_email(db, current_user)
