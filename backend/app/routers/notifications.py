"""
Notifications router — /api/notifications
"""
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser
from app.services import notification_service

router = APIRouter(tags=["Notifications"])
DB = Annotated[AsyncSession, Depends(get_db)]


@router.get(
    "",
    summary="List notifications for current user (unread first)",
)
async def list_notifications(current_user: CurrentUser, db: DB):
    return await notification_service.list_notifications(db, current_user)


@router.patch(
    "/{notification_id}/read",
    summary="Mark a notification as read",
)
async def mark_read(
    notification_id: uuid.UUID,
    current_user: CurrentUser,
    db: DB,
):
    return await notification_service.mark_read(db, current_user, notification_id)


@router.patch(
    "/read-all",
    summary="Mark all notifications as read",
)
async def mark_all_read(current_user: CurrentUser, db: DB):
    return await notification_service.mark_all_read(db, current_user)
