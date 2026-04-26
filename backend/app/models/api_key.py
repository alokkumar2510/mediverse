"""ApiKey ORM model — programmatic API access (future)."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class ApiKey(Base):
    """
    Enables programmatic access via API keys (clinic integrations, webhooks).
    The actual key is shown ONCE on creation; we store only the prefix + hash.
    Format: mv_live_{32-char-random}  (like Stripe's key format)
    """
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Human name for the key e.g. "Clinic A Integration"
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # First 8 chars of key for display — e.g. "mv_live_"
    prefix: Mapped[str] = mapped_column(String(12), nullable=False)

    # SHA-256 hash of the full key
    key_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)

    # Scopes stored as JSON list: ["read:reports", "write:upload", "read:*"]
    scopes: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Rate limit override (None = use global default)
    rate_limit_per_minute: Mapped[int | None] = mapped_column(Integer, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="api_keys")
