"""
MediVerse AI — Security utilities
JWT · bcrypt · Secure token generation · Token hashing
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings

settings = get_settings()
_ALGORITHM = settings.JWT_ALGORITHM


# ── Password hashing ──────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Return a bcrypt hash of the plaintext password (rounds=12)."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plaintext: str, hashed: str) -> bool:
    """Constant-time comparison of plaintext against bcrypt hash."""
    return bcrypt.checkpw(plaintext.encode("utf-8"), hashed.encode("utf-8"))


# ── JWT token creation ────────────────────────────────────────────────────────

def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[dict] = None,
) -> str:
    """
    Create a short-lived access JWT.
    Includes: sub, exp, iat, type=access
    extra_claims: inject role, jti, etc.
    """
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.JWT_EXPIRE_MINUTES))
    payload: dict = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """
    Create a long-lived refresh JWT (type=refresh).
    Refresh tokens must NOT be used as access tokens — enforced in decode_token.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "type": "refresh",
        # jti allows future revocation per-token (store in Redis)
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=_ALGORITHM)


# ── JWT verification ──────────────────────────────────────────────────────────

def decode_token(token: str, expected_type: str = "access") -> Optional[dict]:
    """
    Decode and validate a JWT.
    Returns the full payload dict (not just sub) so callers can access jti, role, etc.
    Returns None on any failure.
    Enforces token type to prevent refresh tokens being used as access tokens.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[_ALGORITHM])
        if payload.get("type") != expected_type:
            return None
        return payload
    except JWTError:
        return None


def decode_token_subject(token: str, expected_type: str = "access") -> Optional[str]:
    """Convenience: return just the 'sub' claim or None."""
    payload = decode_token(token, expected_type)
    return payload.get("sub") if payload else None


def decode_refresh_token(token: str) -> Optional[str]:
    """Returns user UUID str from refresh token, or None."""
    return decode_token_subject(token, expected_type="refresh")


# ── Secure one-time tokens (password reset / email verify) ────────────────────

def generate_secure_token() -> str:
    """
    Generate a cryptographically secure URL-safe token (32 bytes → 64 hex chars).
    This is the plaintext token sent in emails.
    """
    return secrets.token_urlsafe(32)


def hash_token(plaintext_token: str) -> str:
    """
    SHA-256 hash of the plaintext token for DB storage.
    Never store plaintext reset/verify tokens.
    """
    return hashlib.sha256(plaintext_token.encode()).hexdigest()


def token_expiry(minutes: int = 60) -> datetime:
    """Return a UTC datetime N minutes from now (for reset/verify token expiry)."""
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)


# ── CSRF token helper ─────────────────────────────────────────────────────────

def generate_csrf_token() -> str:
    """Generate a CSRF double-submit token."""
    return secrets.token_hex(32)
