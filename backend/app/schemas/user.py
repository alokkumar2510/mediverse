"""User profile schemas."""
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    avatar_url: str | None
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=100)
    avatar_url: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
