"""ModelVersion ORM model — tracks deployed AI model artifacts."""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class ModelVersion(Base):
    """
    Tracks every version of every AI model deployed to MediVerse.
    Services read from this table to know which model file to load
    and to tag reports with the correct model version.
    """
    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Maps to module_type in reports (xray | ecg | skin | diabetes | ocr | symptom)
    module_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Semantic version e.g. "1.0.0", "2.1.3"
    version: Mapped[str] = mapped_column(String(50), nullable=False)

    # Human-readable release notes
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Path or URL to the model artifact (ONNX/pickle/etc.)
    artifact_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Validation metrics at time of release
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    auc_roc: Mapped[float | None] = mapped_column(Float, nullable=True)
    precision: Mapped[float | None] = mapped_column(Float, nullable=True)
    recall: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Framework: onnx | xgboost | sklearn | pytorch
    framework: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Only one model per module can be active at a time
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    released_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ModelVersion module={self.module_type!r} v={self.version!r} active={self.is_active}>"
