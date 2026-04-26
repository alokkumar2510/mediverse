"""Auth Pydantic v2 schemas — request/response contracts for all auth endpoints."""
import re
from typing import Optional
import uuid

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Reusable password validator ───────────────────────────────────────────────

def _validate_password(v: str) -> str:
    """
    Enforce strong passwords:
    - At least 8 characters
    - At least one uppercase letter
    - At least one digit
    - At least one special character
    """
    if len(v) < 8:
        raise ValueError("Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", v):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"\d", v):
        raise ValueError("Password must contain at least one digit.")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
        raise ValueError("Password must contain at least one special character.")
    return v


# ── Requests ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Dr. Priya Sharma"])
    email: EmailStr = Field(..., examples=["priya@clinic.com"])
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        return _validate_password(v)


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["priya@clinic.com"])
    password: str = Field(..., min_length=1)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = Field(None)
    logout_all: bool = Field(False, description="Revoke all sessions (all devices)")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(..., examples=["priya@clinic.com"])


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10, description="Token from reset email")
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def strong_password(cls, v: str) -> str:
        return _validate_password(v)


class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=10, description="Token from verification email")


# ── Responses ─────────────────────────────────────────────────────────────────

class AuthUserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    is_verified: bool
    is_active: bool
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: AuthUserResponse
