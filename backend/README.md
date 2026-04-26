# MediVerse AI Backend

## Quick start

```bash
# 1. Create venv & install
cd backend
python -m venv .venv && .venv\Scripts\activate    # Windows
pip install -r requirements.txt

# 2. Environment variables
cp .env.example .env
# Edit .env → set DATABASE_URL, JWT_SECRET

# 3. Database migrations
alembic upgrade head

# 4. Run dev server
uvicorn app.main:app --reload --port 8000
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login → JWT pair |
| POST | /api/auth/refresh | — | Rotate tokens |
| POST | /api/auth/logout | — | Client-side logout |
| GET | /api/auth/me | ✓ | Current user |
| GET | /api/user/profile | ✓ | User profile |
| PUT | /api/user/profile | ✓ | Update profile |
| POST | /api/user/change-password | ✓ | Change password |
| GET | /api/reports | ✓ | Paginated report list |
| GET | /api/reports/{id} | ✓ | Single report |
| DELETE | /api/reports/{id} | ✓ | Soft-delete report |
| POST | /api/diabetes/predict | ✓ | Diabetes risk prediction |
| POST | /api/symptom/check | ✓ | Symptom triage |
| POST | /api/xray/analyze | ✓ | X-ray analysis (upload) |
| POST | /api/ecg/analyze | ✓ | ECG analysis (upload) |
| POST | /api/skin/analyze | ✓ | Skin diagnosis (upload) |
| POST | /api/ocr/prescription | ✓ | Prescription OCR (upload) |
| GET | /api/admin/stats | Admin | Platform KPIs |
| GET | /api/admin/users | Admin | All users |
| GET | /api/admin/logs | Admin | Request logs |
| GET | /api/health | — | Health check |
| GET | /api/health/db | — | Database connectivity |

## Running tests

```bash
pytest -v --asyncio-mode=auto
```

## Architecture

```
app/
├── core/           # Config, DB engine, security, deps
├── models/         # SQLAlchemy ORM (7 tables)
├── schemas/        # Pydantic v2 request/response
├── services/       # Business logic layer
├── routers/        # Thin HTTP handlers (10 routers)
├── middleware/     # Logging, rate limiting
├── utils/          # File validation
└── main.py         # App factory
migrations/         # Alembic async migrations
tests/              # pytest-asyncio test suite
```
