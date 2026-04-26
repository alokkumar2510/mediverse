"""
SQLAlchemy models package.
ALL models must be imported here so Alembic sees complete metadata.
"""
from app.core.database import Base  # noqa: F401

# ── Core user models ──────────────────────────────────────────────────────────
from app.models.user           import User, UserRole       # noqa: F401
from app.models.session        import Session              # noqa: F401
from app.models.password_reset import PasswordReset        # noqa: F401
from app.models.api_key        import ApiKey               # noqa: F401

# ── Medical data models ───────────────────────────────────────────────────────
from app.models.report         import Report               # noqa: F401
from app.models.upload         import Upload               # noqa: F401

# ── Engagement models ─────────────────────────────────────────────────────────
from app.models.feedback       import Feedback             # noqa: F401
from app.models.notification   import Notification         # noqa: F401
from app.models.subscription   import Subscription         # noqa: F401

# ── Analytics / observability ─────────────────────────────────────────────────
from app.models.usage_log      import UsageLog             # noqa: F401

# ── AI infrastructure ─────────────────────────────────────────────────────────
from app.models.model_version  import ModelVersion         # noqa: F401

__all__ = [
    "Base",
    # User domain
    "User", "UserRole", "Session", "PasswordReset", "ApiKey",
    # Medical
    "Report", "Upload",
    # Engagement
    "Feedback", "Notification", "Subscription",
    # Analytics
    "UsageLog",
    # AI
    "ModelVersion",
]
