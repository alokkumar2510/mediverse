"""User service — profile CRUD."""
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest, UserProfileResponse


async def get_profile(user: User) -> UserProfileResponse:
    return UserProfileResponse.model_validate(user)


async def update_profile(
    db: AsyncSession, user: User, body: UpdateProfileRequest
) -> UserProfileResponse:
    if body.name is not None:
        user.name = body.name
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url
    db.add(user)
    await db.flush()
    return UserProfileResponse.model_validate(user)


async def change_password(
    db: AsyncSession, user: User, body: ChangePasswordRequest
) -> dict:
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    user.password_hash = hash_password(body.new_password)
    db.add(user)
    await db.flush()
    return {"message": "Password updated successfully"}
