"""
User ORM model — extended with all relationships.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    user  = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    # ── Primary Key ───────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # ── Identity ──────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── OAuth support (provider + provider_id for Google/GitHub etc.) ─
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    oauth_provider_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── RBAC ──────────────────────────────────────────────────────────
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default=UserRole.user.value
    )

    # ── Account status ────────────────────────────────────────────────
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Audit timestamps ──────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # ── Relationships ─────────────────────────────────────────────────
    reports:         Mapped[list["Report"]]        = relationship(back_populates="user", cascade="all, delete-orphan")
    uploads:         Mapped[list["Upload"]]        = relationship(back_populates="user", cascade="all, delete-orphan")
    feedbacks:       Mapped[list["Feedback"]]      = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications:   Mapped[list["Notification"]]  = relationship(back_populates="user", cascade="all, delete-orphan")
    subscriptions:   Mapped[list["Subscription"]]  = relationship(back_populates="user", cascade="all, delete-orphan")
    sessions:        Mapped[list["Session"]]       = relationship(back_populates="user", cascade="all, delete-orphan")
    password_resets: Mapped[list["PasswordReset"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    api_keys:        Mapped[list["ApiKey"]]        = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role!r}>"
