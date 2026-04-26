"""User router — /api/user/*"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.schemas.common import MessageResponse
from app.schemas.user import ChangePasswordRequest, UpdateProfileRequest, UserProfileResponse
from app.services import user_service

router = APIRouter()


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: CurrentUser) -> UserProfileResponse:
    return await user_service.get_profile(current_user)


@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserProfileResponse:
    return await user_service.update_profile(db, current_user, body)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    body: ChangePasswordRequest,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await user_service.change_password(db, current_user, body)
    return MessageResponse(message=result["message"])
