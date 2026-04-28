"""
MediVerse AI — Database Seed Script
Run: python database/seed.py

Creates:
  - 1 admin user
  - 2 demo users
  - 6 model_version records (one per AI module)
  - sample reports, notifications, feedback, subscriptions
"""
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from hashlib import sha256

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.core.config import get_settings
from app.core.security import hash_password
from app.models import (
    User, Report, Feedback, Notification,
    Subscription, ModelVersion,
)

settings = get_settings()

# ── Engine ────────────────────────────────────────────────────────────────────
db_url = settings.DATABASE_URL
if not db_url.lower().startswith("sqlite"):
    db_url += "&prepared_statement_cache_size=0" if "?" in db_url else "?prepared_statement_cache_size=0"

engine = create_async_engine(
    db_url,
    echo=False,
    connect_args={"statement_cache_size": 0} if not db_url.lower().startswith("sqlite") else {},
)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


# ── Helpers ───────────────────────────────────────────────────────────────────
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def past(days: int) -> datetime:
    return now_utc() - timedelta(days=days)


# ── Seed data ─────────────────────────────────────────────────────────────────
ADMIN_ID   = uuid.UUID("00000000-0000-0000-0000-000000000001")
USER1_ID   = uuid.UUID("00000000-0000-0000-0000-000000000002")
USER2_ID   = uuid.UUID("00000000-0000-0000-0000-000000000003")

USERS = [
    {
        "id": ADMIN_ID,
        "name": "MediVerse Admin",
        "email": "admin@mediverse.ai",
        "password_hash": hash_password("Admin@123456"),
        "role": "admin",
        "is_active": True,
        "is_verified": True,
        "email_verified_at": past(30),
        "created_at": past(60),
        "updated_at": past(1),
        "last_login_at": past(0),
    },
    {
        "id": USER1_ID,
        "name": "Dr. Priya Sharma",
        "email": "priya@demo.mediverse.ai",
        "password_hash": hash_password("Demo@123456"),
        "role": "user",
        "is_active": True,
        "is_verified": True,
        "email_verified_at": past(20),
        "created_at": past(30),
        "updated_at": past(2),
        "last_login_at": past(1),
    },
    {
        "id": USER2_ID,
        "name": "Dr. Rahul Verma",
        "email": "rahul@demo.mediverse.ai",
        "password_hash": hash_password("Demo@123456"),
        "role": "user",
        "is_active": True,
        "is_verified": False,
        "created_at": past(7),
        "updated_at": past(0),
        "last_login_at": None,
    },
]

MODEL_VERSIONS = [
    {
        "id": uuid.uuid4(),
        "module_type": "xray",
        "version": "1.0.0",
        "description": "Chest X-Ray pneumonia classifier — DenseNet-121 ONNX",
        "framework": "onnx",
        "accuracy": 0.923,
        "auc_roc": 0.971,
        "precision": 0.918,
        "recall": 0.929,
        "is_active": True,
        "released_at": past(45),
    },
    {
        "id": uuid.uuid4(),
        "module_type": "ecg",
        "version": "1.0.0",
        "description": "ECG arrhythmia classifier — 12-class CNN",
        "framework": "pytorch",
        "accuracy": 0.951,
        "auc_roc": 0.988,
        "is_active": True,
        "released_at": past(30),
    },
    {
        "id": uuid.uuid4(),
        "module_type": "skin",
        "version": "1.0.0",
        "description": "Skin lesion 7-class classifier — EfficientNet-B4",
        "framework": "onnx",
        "accuracy": 0.871,
        "auc_roc": 0.942,
        "is_active": True,
        "released_at": past(20),
    },
    {
        "id": uuid.uuid4(),
        "module_type": "diabetes",
        "version": "1.0.0",
        "description": "Diabetes risk prediction — XGBoost tabular model",
        "framework": "xgboost",
        "accuracy": 0.894,
        "auc_roc": 0.932,
        "precision": 0.889,
        "recall": 0.902,
        "is_active": True,
        "released_at": past(15),
    },
    {
        "id": uuid.uuid4(),
        "module_type": "ocr",
        "version": "1.0.0",
        "description": "Prescription OCR — Tesseract + rule-based NER",
        "framework": "stub",
        "accuracy": 0.882,
        "is_active": True,
        "released_at": past(10),
    },
    {
        "id": uuid.uuid4(),
        "module_type": "symptom",
        "version": "1.0.0",
        "description": "Symptom triage — rule-based + LLM summariser",
        "framework": "stub",
        "accuracy": None,
        "is_active": True,
        "released_at": past(5),
    },
]

REPORTS = [
    {
        "id": uuid.uuid4(),
        "user_id": USER1_ID,
        "module_type": "diabetes",
        "title": "Diabetes Risk Screening — Apr 2026",
        "result_json": {
            "risk_level": "moderate",
            "risk_score": 0.61,
            "probability": {"diabetes": 0.61, "no_diabetes": 0.39},
            "key_factors": ["elevated_glucose", "high_bmi"],
            "recommendation": "Consult endocrinologist. Monitor HbA1c.",
        },
        "confidence": 0.87,
        "status": "completed",
        "created_at": past(3),
    },
    {
        "id": uuid.uuid4(),
        "user_id": USER1_ID,
        "module_type": "xray",
        "title": "Chest X-Ray — Normal",
        "result_json": {
            "prediction": "Normal",
            "findings": ["No consolidation", "Clear lung fields", "Normal cardiac silhouette"],
            "abnormality_score": 0.07,
        },
        "confidence": 0.96,
        "status": "completed",
        "created_at": past(10),
    },
    {
        "id": uuid.uuid4(),
        "user_id": USER1_ID,
        "module_type": "symptom",
        "title": "Symptom Check — Fatigue & Headache",
        "result_json": {
            "possible_conditions": [
                {"condition": "Tension Headache", "probability": 0.52},
                {"condition": "Anaemia", "probability": 0.28},
                {"condition": "Hypertension", "probability": 0.14},
            ],
            "urgency": "low",
            "recommendation": "Rest and hydration. Follow up if persistent.",
        },
        "confidence": None,
        "status": "completed",
        "created_at": past(1),
    },
]

NOTIFICATIONS = [
    {
        "id": uuid.uuid4(),
        "user_id": USER1_ID,
        "title": "Welcome to MediVerse AI 🎉",
        "message": "Your account is ready. Start with a Diabetes screening.",
        "is_read": True,
        "created_at": past(30),
    },
    {
        "id": uuid.uuid4(),
        "user_id": USER1_ID,
        "title": "Report Ready",
        "message": "Your Chest X-Ray analysis is complete.",
        "is_read": False,
        "created_at": past(10),
    },
    {
        "id": uuid.uuid4(),
        "user_id": USER2_ID,
        "title": "Verify Your Email",
        "message": "Please verify your email address to access all features.",
        "is_read": False,
        "created_at": past(7),
    },
]

FEEDBACK = [
    {
        "id": uuid.uuid4(),
        "user_id": USER1_ID,
        "rating": 5,
        "message": "Diabetes screening was accurate and fast. Excellent product!",
        "status": "reviewed",
        "created_at": past(2),
    },
    {
        "id": uuid.uuid4(),
        "user_id": USER1_ID,
        "rating": 4,
        "message": "X-ray analysis was great. Would love PDF export of reports.",
        "status": "open",
        "created_at": past(9),
    },
]

SUBSCRIPTIONS = [
    {
        "id": uuid.uuid4(),
        "user_id": USER1_ID,
        "plan": "pro",
        "status": "active",
        "starts_at": past(30),
        "expires_at": now_utc() + timedelta(days=335),
        "created_at": past(30),
    },
    {
        "id": uuid.uuid4(),
        "user_id": USER2_ID,
        "plan": "free",
        "status": "active",
        "starts_at": past(7),
        "expires_at": None,
        "created_at": past(7),
    },
    {
        "id": uuid.uuid4(),
        "user_id": ADMIN_ID,
        "plan": "clinic",
        "status": "active",
        "starts_at": past(60),
        "expires_at": now_utc() + timedelta(days=305),
        "created_at": past(60),
    },
]


# ── Main seeder ───────────────────────────────────────────────────────────────
async def seed():
    async with SessionLocal() as session:
        async with session.begin():
            print("🌱  Checking for existing seed data...")

            # Check if already seeded
            from sqlalchemy import select
            existing = await session.execute(select(User).where(User.id == ADMIN_ID))
            if existing.scalar_one_or_none():
                print("⚠️  Seed data already exists. Skipping.")
                return

            print("📦  Inserting model versions...")
            for mv in MODEL_VERSIONS:
                session.add(ModelVersion(**mv))
            await session.flush()

            print("👤  Inserting users...")
            for u in USERS:
                session.add(User(**u))
            await session.flush()

            print("📊  Inserting reports...")
            for r in REPORTS:
                session.add(Report(**r))

            print("🔔  Inserting notifications...")
            from app.models.notification import Notification
            for n in NOTIFICATIONS:
                session.add(Notification(**n))

            print("💬  Inserting feedback...")
            for f in FEEDBACK:
                session.add(Feedback(**f))

            print("💳  Inserting subscriptions...")
            for s in SUBSCRIPTIONS:
                session.add(Subscription(**s))

        print("\n✅  Seed complete!")
        print("────────────────────────────────────")
        print("  admin@mediverse.ai  /  Admin@123456")
        print("  priya@demo.mediverse.ai  /  Demo@123456")
        print("  rahul@demo.mediverse.ai  /  Demo@123456")
        print("────────────────────────────────────")


if __name__ == "__main__":
    asyncio.run(seed())
