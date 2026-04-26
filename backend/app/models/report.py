"""Report ORM model — full production version with starred, tags, archived."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey,
    Index, JSON, String, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # xray | ecg | skin | diabetes | ocr | symptom | future
    module_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title:       Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Full structured result from AI inference engine
    result_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    confidence:  Mapped[float | None] = mapped_column(Float, nullable=True)

    # completed | failed | pending
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="completed")

    # User metadata
    is_starred:  Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_deleted:  Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Comma-separated tags stored as JSON array
    tags: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Notes field (clinician comments)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="reports")

    __table_args__ = (
        # Composite index for the most common query pattern
        Index("ix_reports_user_module_deleted", "user_id", "module_type", "is_deleted"),
        Index("ix_reports_user_starred", "user_id", "is_starred"),
        Index("ix_reports_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Report id={self.id} module={self.module_type!r} user={self.user_id}>"
