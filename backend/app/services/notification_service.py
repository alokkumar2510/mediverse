"""
Notification Service
"""
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.user import User
from app.schemas.common import MessageResponse


async def list_notifications(db: AsyncSession, user: User) -> list[dict[str, Any]]:
    q = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.is_read, Notification.created_at.desc())
        .limit(20)
    )
    notifs = q.scalars().all()
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "body": n.body,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


async def mark_read(
    db: AsyncSession,
    user: User,
    notification_id: uuid.UUID,
) -> MessageResponse:
    q = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
    )
    notif = q.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    notif.read_at = datetime.now(timezone.utc)
    db.add(notif)
    return MessageResponse(message="Marked as read.")


async def mark_all_read(db: AsyncSession, user: User) -> MessageResponse:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user.id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    return MessageResponse(message="All notifications marked as read.")
