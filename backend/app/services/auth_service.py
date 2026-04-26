"""
Auth Service — complete implementation.
Registration · Login · Refresh · Logout · Password Reset · Email Verify
Session-backed refresh tokens with device tracking.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import HTTPException, Request, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_secure_token,
    hash_password,
    hash_token,
    token_expiry,
    verify_password,
)
from app.models.password_reset import PasswordReset
from app.models.session import Session
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from app.schemas.common import MessageResponse

settings = get_settings()


# ── Internal helpers ──────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _make_tokens(user: User) -> tuple[str, str]:
    subject = str(user.id)
    access  = create_access_token(subject, extra_claims={"role": user.role})
    refresh = create_refresh_token(subject)
    return access, refresh


def _token_response(access: str, refresh: str, user: User) -> TokenResponse:
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        token_type="bearer",
        expires_in=settings.JWT_EXPIRE_MINUTES * 60,
        user=AuthUserResponse.model_validate(user),
    )


async def _create_session(
    db: AsyncSession,
    user: User,
    refresh_token: str,
    request: Optional[Request] = None,
) -> Session:
    """Persist a hashed refresh token as a DB session for revocation support."""
    token_h = hash_token(refresh_token)
    ip      = request.client.host if request and request.client else None
    ua      = request.headers.get("user-agent") if request else None

    session = Session(
        user_id=user.id,
        token_hash=token_h,
        ip_address=ip,
        user_agent=ua,
        is_revoked=False,
        expires_at=_now() + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS),
    )
    db.add(session)
    await db.flush()
    return session


# ── Registration ──────────────────────────────────────────────────────────────

async def register_user(
    db: AsyncSession,
    body: RegisterRequest,
    request: Optional[Request] = None,
) -> TokenResponse:
    """
    1. Reject duplicate emails (case-insensitive)
    2. Create user with bcrypt-hashed password
    3. Issue access + refresh tokens
    4. Create DB session record
    """
    existing = await db.execute(
        select(User).where(func.lower(User.email) == body.email.lower())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=body.name,
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    access, refresh = _make_tokens(user)
    await _create_session(db, user, refresh, request)

    # TODO Wave 2: queue welcome + email verification email
    return _token_response(access, refresh, user)


# ── Login ─────────────────────────────────────────────────────────────────────

async def login_user(
    db: AsyncSession,
    body: LoginRequest,
    request: Optional[Request] = None,
) -> TokenResponse:
    """
    Constant-time path regardless of whether user exists — prevents user enumeration.
    On success: update last_login_at, create a new session, return token pair.
    """
    result = await db.execute(
        select(User).where(func.lower(User.email) == body.email.lower())
    )
    user = result.scalar_one_or_none()

    # Always run verify_password to prevent timing attacks
    dummy_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2E3tGFmVjO"
    password_ok = verify_password(body.password, user.password_hash if user else dummy_hash)

    if user is None or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact support.",
        )

    # Update last login
    await db.execute(
        update(User).where(User.id == user.id).values(last_login_at=_now())
    )

    access, refresh = _make_tokens(user)
    await _create_session(db, user, refresh, request)

    return _token_response(access, refresh, user)


# ── Refresh tokens ────────────────────────────────────────────────────────────

async def refresh_tokens(
    db: AsyncSession,
    body: RefreshRequest,
    request: Optional[Request] = None,
) -> TokenResponse:
    """
    Token rotation strategy:
    1. Validate JWT signature + expiry
    2. Verify token_hash exists in sessions table and is not revoked
    3. Revoke old session
    4. Issue new token pair + create new session
    """
    user_id_str = decode_refresh_token(body.refresh_token)
    if not user_id_str:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Malformed token.")

    # Validate session exists and is active
    token_h = hash_token(body.refresh_token)
    sess_result = await db.execute(
        select(Session).where(
            Session.token_hash == token_h,
            Session.is_revoked == False,  # noqa: E712
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session or session.expires_at.replace(tzinfo=timezone.utc) < _now():
        raise HTTPException(status_code=401, detail="Session expired or revoked.")

    # Look up user
    user_result = await db.execute(select(User).where(User.id == user_uuid))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive.")

    # Revoke old session (token rotation)
    session.is_revoked = True
    db.add(session)

    # Issue new pair + new session
    access, refresh = _make_tokens(user)
    await _create_session(db, user, refresh, request)

    return _token_response(access, refresh, user)


# ── Logout ────────────────────────────────────────────────────────────────────

async def logout_user(
    db: AsyncSession,
    body: RefreshRequest,
) -> MessageResponse:
    """
    Revoke the session tied to the provided refresh token.
    If token is invalid/already revoked: silently succeed (idempotent).
    """
    if body.refresh_token:
        token_h = hash_token(body.refresh_token)
        result = await db.execute(
            select(Session).where(Session.token_hash == token_h)
        )
        session = result.scalar_one_or_none()
        if session and not session.is_revoked:
            session.is_revoked = True
            db.add(session)

    return MessageResponse(message="Logged out successfully.")


async def logout_all_sessions(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> MessageResponse:
    """Revoke ALL sessions for a user (force logout from all devices)."""
    await db.execute(
        update(Session)
        .where(Session.user_id == user_id, Session.is_revoked == False)  # noqa: E712
        .values(is_revoked=True)
    )
    return MessageResponse(message="All sessions revoked.")


# ── Get current user ──────────────────────────────────────────────────────────

async def get_me(user: User) -> AuthUserResponse:
    return AuthUserResponse.model_validate(user)


# ── Forgot password ───────────────────────────────────────────────────────────

async def forgot_password(
    db: AsyncSession,
    body: ForgotPasswordRequest,
) -> MessageResponse:
    """
    Always returns success to prevent user enumeration.
    If user found: invalidate old tokens, create new reset token, send email.
    """
    result = await db.execute(
        select(User).where(func.lower(User.email) == body.email.lower())
    )
    user = result.scalar_one_or_none()

    if user and user.is_active:
        # Invalidate any existing unused tokens
        existing = await db.execute(
            select(PasswordReset).where(
                PasswordReset.user_id == user.id,
                PasswordReset.is_used == False,  # noqa: E712
            )
        )
        for old_token in existing.scalars().all():
            old_token.is_used = True
            db.add(old_token)

        plaintext = generate_secure_token()
        reset_record = PasswordReset(
            user_id=user.id,
            token_hash=hash_token(plaintext),
            is_used=False,
            expires_at=token_expiry(minutes=60),  # 1-hour window
        )
        db.add(reset_record)

        # TODO Wave 2: queue email via SendGrid/SES
        # await send_reset_email(user.email, plaintext)
        print(f"[DEV] Password reset link: /reset-password?token={plaintext}")

    return MessageResponse(
        message="If an account with that email exists, a reset link has been sent."
    )


# ── Reset password ────────────────────────────────────────────────────────────

async def reset_password(
    db: AsyncSession,
    body: ResetPasswordRequest,
) -> MessageResponse:
    """
    1. Validate token hash → find PasswordReset record
    2. Check not expired, not used
    3. Update user password
    4. Mark token used, revoke all sessions (force re-login)
    """
    token_h = hash_token(body.token)
    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.token_hash == token_h,
            PasswordReset.is_used == False,  # noqa: E712
        )
    )
    reset_record = result.scalar_one_or_none()

    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if reset_record.expires_at.replace(tzinfo=timezone.utc) < _now():
        reset_record.is_used = True
        db.add(reset_record)
        raise HTTPException(status_code=400, detail="Reset token has expired. Request a new one.")

    # Update user password
    user_result = await db.execute(select(User).where(User.id == reset_record.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.password_hash = hash_password(body.new_password)
    db.add(user)

    # Consume token
    reset_record.is_used = True
    reset_record.used_at = _now()
    db.add(reset_record)

    # Revoke all sessions — force re-login after password change
    await db.execute(
        update(Session)
        .where(Session.user_id == user.id, Session.is_revoked == False)  # noqa: E712
        .values(is_revoked=True)
    )

    return MessageResponse(message="Password reset successful. Please log in.")


# ── Email verification ────────────────────────────────────────────────────────

async def send_verification_email(
    db: AsyncSession,
    user: User,
) -> MessageResponse:
    """
    Generate email verification token and queue email.
    Stored in the password_resets table with a special 'verify' prefix in the token.
    (Future: dedicated email_verifications table)
    """
    plaintext = generate_secure_token()
    record = PasswordReset(
        user_id=user.id,
        token_hash=hash_token(f"verify:{plaintext}"),
        is_used=False,
        expires_at=token_expiry(minutes=1440),  # 24-hour window
    )
    db.add(record)

    # TODO Wave 2: queue verification email
    print(f"[DEV] Verify email link: /verify-email?token={plaintext}")
    return MessageResponse(message="Verification email sent.")


async def verify_email(
    db: AsyncSession,
    body: VerifyEmailRequest,
) -> MessageResponse:
    """Validate verification token → mark user.is_verified = True."""
    token_h = hash_token(f"verify:{body.token}")
    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.token_hash == token_h,
            PasswordReset.is_used == False,  # noqa: E712
        )
    )
    record = result.scalar_one_or_none()

    if not record or record.expires_at.replace(tzinfo=timezone.utc) < _now():
        raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

    user_result = await db.execute(select(User).where(User.id == record.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    user.is_verified = True
    user.email_verified_at = _now()
    db.add(user)

    record.is_used = True
    record.used_at = _now()
    db.add(record)

    return MessageResponse(message="Email verified successfully.")
