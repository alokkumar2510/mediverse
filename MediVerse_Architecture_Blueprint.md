# MediVerse AI — Master Architecture Blueprint
**Version:** 1.0 | **Owner:** Alok | **Domain:** mediverse.alokkumarsahu.in

---

## 1. High-Level System Diagram

```
User Browser / Mobile
      │
      ▼
Cloudflare (DNS + CDN + DDoS protection + SSL)
      │
      ├──► mediverse.alokkumarsahu.in  ──► Vercel (Next.js 14 App Router)
      │
      └──► api.mediverse.alokkumarsahu.in ──► Azure Container Apps (FastAPI)
                          │
                          ├──► Supabase PostgreSQL
                          ├──► Redis (Upstash / Azure Cache)
                          ├──► ML Services (in-process ONNX / XGBoost)
                          └──► Cloudinary (file storage, optional)
```

---

## 2. Monorepo Structure

```
mediverse/                          ← project root (e:\Mediverse)
├── frontend/                       ← Next.js 14 App Router (TypeScript + Tailwind + shadcn/ui)
│   ├── app/                        ← All routes live here (App Router)
│   │   ├── (public)/               ← Landing, About, Features, Pricing, Contact
│   │   ├── (auth)/                 ← Login, Signup, Forgot Password
│   │   ├── (protected)/            ← Dashboard, AI Modules, Reports, Settings
│   │   └── (admin)/                ← Admin console (role-gated)
│   ├── components/                 ← Reusable UI: ui/, layout/, modules/
│   ├── hooks/                      ← Custom React hooks
│   ├── lib/                        ← API client, auth helpers, utils
│   ├── stores/                     ← Zustand global state
│   ├── types/                      ← Shared TypeScript types
│   └── public/                     ← Static assets
│
├── backend/                        ← FastAPI (Python 3.11+)
│   └── app/
│       ├── main.py                 ← App factory, CORS, middleware registration
│       ├── core/
│       │   ├── config.py           ← Pydantic Settings (env-driven)
│       │   ├── database.py         ← SQLAlchemy async engine + session factory
│       │   ├── security.py         ← JWT creation/verification, bcrypt hashing
│       │   └── deps.py             ← FastAPI dependency injectors
│       ├── models/                 ← SQLAlchemy ORM models (1 file per table)
│       ├── schemas/                ← Pydantic request/response schemas
│       ├── routers/                ← One router per domain (auth, xray, ecg…)
│       ├── services/               ← Business logic layer (thin routers, fat services)
│       ├── ml/                     ← ML inference engines
│       │   ├── xray_model.py
│       │   ├── ecg_model.py
│       │   ├── skin_model.py
│       │   ├── diabetes_model.py
│       │   ├── ocr_model.py
│       │   └── symptom_model.py
│       ├── middleware/             ← Rate limiter, request logger, CORS
│       └── utils/                  ← File validation, image helpers, formatters
│
├── .env.example                    ← Template for all env vars
├── docker-compose.yml              ← Local dev: FastAPI + Redis + Postgres
└── README.md
```

---

## 3. Frontend Route Map (Next.js App Router)

| Route Group | Path | Component | Auth Required |
|---|---|---|---|
| Public | `/` | LandingPage | No |
| Public | `/about` `/features` `/pricing` | Static pages | No |
| Auth | `/login` `/signup` `/forgot-password` | AuthPages | No |
| Protected | `/dashboard` | Dashboard | Yes |
| Protected | `/xray` `/ecg` `/skin` `/diabetes` `/prescription` `/symptoms` | AI Modules | Yes |
| Protected | `/reports` `/reports/[id]` | Reports | Yes |
| Protected | `/settings` `/profile` | User settings | Yes |
| Admin | `/admin` `/admin/users` `/admin/analytics` `/admin/logs` | Admin Console | Admin role |

---

## 4. Backend API Contract

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | New user registration |
| POST | `/api/auth/login` | JWT token pair (access + refresh) |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/refresh` | Refresh access token |

### AI Modules
| Method | Path | Input | Output |
|---|---|---|---|
| POST | `/api/xray/analyze` | multipart image | type, condition, confidence, heatmap_url, recommendation |
| POST | `/api/ecg/analyze` | multipart image | rhythm, risk_flags, confidence |
| POST | `/api/skin/analyze` | multipart image | condition, confidence, severity, care_tips |
| POST | `/api/diabetes/predict` | JSON body | risk_pct, risk_tier, suggestions |
| POST | `/api/ocr/prescription` | multipart image/PDF | medicines[], dosages[], warnings[] |
| POST | `/api/symptom/check` | JSON {text} | conditions[], urgency_score, specialist |

### Reports & User
| Method | Path | Description |
|---|---|---|
| GET | `/api/reports` | Paginated user reports |
| GET | `/api/reports/{id}` | Single report detail |
| DELETE | `/api/reports/{id}` | Soft delete |
| GET | `/api/user/profile` | User data |
| PUT | `/api/user/profile` | Update profile |

### Admin (role=admin)
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform KPIs |
| GET | `/api/admin/users` | User list |
| GET | `/api/admin/logs` | Usage log tail |
| GET | `/api/admin/models` | ML model health |

---

## 5. Database Schema (PostgreSQL via Supabase)

```sql
-- users
id              UUID PK DEFAULT gen_random_uuid()
name            VARCHAR(100) NOT NULL
email           VARCHAR(255) UNIQUE NOT NULL
password_hash   TEXT NOT NULL
avatar_url      TEXT
role            VARCHAR(20) DEFAULT 'user'    -- user | admin
is_active       BOOLEAN DEFAULT true
is_verified     BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()
updated_at      TIMESTAMPTZ DEFAULT now()

-- reports
id              UUID PK
user_id         UUID FK → users.id ON DELETE CASCADE
module_type     VARCHAR(50) NOT NULL           -- xray|ecg|skin|diabetes|ocr|symptom
title           VARCHAR(255)
result_json     JSONB NOT NULL
confidence      FLOAT
status          VARCHAR(20) DEFAULT 'completed'
created_at      TIMESTAMPTZ DEFAULT now()

-- uploads
id              UUID PK
user_id         UUID FK → users.id
module_type     VARCHAR(50)
file_name       VARCHAR(255)
file_url        TEXT
mime_type       VARCHAR(100)
file_size       BIGINT
status          VARCHAR(20) DEFAULT 'uploaded'
created_at      TIMESTAMPTZ DEFAULT now()

-- feedback
id              UUID PK
user_id         UUID FK → users.id
rating          INT CHECK (rating BETWEEN 1 AND 5)
message         TEXT
status          VARCHAR(20) DEFAULT 'open'
created_at      TIMESTAMPTZ DEFAULT now()

-- usage_logs
id              UUID PK
user_id         UUID NULL
endpoint        VARCHAR(255)
method          VARCHAR(10)
latency_ms      INT
status_code     INT
ip_address      VARCHAR(100)
created_at      TIMESTAMPTZ DEFAULT now()

-- notifications
id              UUID PK
user_id         UUID FK → users.id
title           VARCHAR(255)
message         TEXT
is_read         BOOLEAN DEFAULT false
created_at      TIMESTAMPTZ DEFAULT now()

-- subscriptions (future)
id              UUID PK
user_id         UUID FK → users.id
plan            VARCHAR(50)          -- free | pro | clinic
status          VARCHAR(50)
starts_at       TIMESTAMPTZ
expires_at      TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT now()
```

---

## 6. ML Module Architecture

| Module | Model Type | Runtime | Input | Latency Target |
|---|---|---|---|---|
| X-ray | CNN (ResNet-50 / EfficientNet) | ONNX Runtime | 224×224 JPEG | <5s |
| ECG | CNN / 1D-Conv | ONNX Runtime | Image / signal | <3s |
| Skin | MobileNetV3 | ONNX Runtime | 224×224 JPEG | <3s |
| Diabetes | XGBoost | XGBoost native | 6 numeric features | <100ms |
| OCR | Tesseract + post-processing | pytesseract | Image / PDF | <2s |
| Symptom | TF-IDF + Logistic / small LLM | scikit-learn / ONNX | Text | <500ms |

Each model file follows: `load()` → `preprocess()` → `infer()` → `postprocess()` interface.

---

## 7. Security Architecture

| Layer | Mechanism |
|---|---|
| Transport | HTTPS everywhere via Cloudflare |
| Auth | JWT (access 60 min + refresh 7 days), bcrypt password hashing |
| Authorization | Role-based (`user` / `admin`) dependency injectors |
| Rate limiting | `slowapi` per IP + per user endpoint |
| File upload | MIME validation, size cap 10 MB, virus scan hook |
| CORS | Whitelist `mediverse.alokkumarsahu.in` only |
| SQL | SQLAlchemy ORM (parameterized), no raw queries |
| Audit | Every request logged to `usage_logs` |
| Secrets | `.env` + Azure Key Vault in prod |

---

## 8. Build Phases & Deliverables

### Stage 1 — Foundation (NOW)
- [ ] Monorepo scaffold (`e:\Mediverse`)
- [ ] Frontend: Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Backend: FastAPI skeleton with core/, middleware/, routers/
- [ ] DB: Supabase project + Alembic migrations (all tables)
- [ ] Auth: JWT register/login/refresh/me
- [ ] .env.example + docker-compose.yml

### Stage 2 — Dashboard + Diabetes + OCR
- [ ] Dashboard page (widgets, sidebar)
- [ ] Diabetes predictor (XGBoost)
- [ ] Prescription OCR (Tesseract)
- [ ] Reports CRUD

### Stage 3 — Skin + Symptom Checker
- [ ] Skin AI (ONNX MobileNetV3)
- [ ] Symptom NLP checker
- [ ] Notification system

### Stage 4 — ECG + X-ray
- [ ] ECG analyzer
- [ ] Universal X-ray router + heatmap
- [ ] Admin console
- [ ] Production polish + Vercel + Azure deploy

---

## 9. Key Environment Variables

```env
# App
APP_NAME=MediVerse AI
ENV=production

# Database
DATABASE_URL=postgresql+asyncpg://...

# Auth
JWT_SECRET=<32-byte random>
JWT_EXPIRE_MINUTES=60
JWT_REFRESH_EXPIRE_DAYS=7

# Redis
REDIS_URL=rediss://...

# Storage
CLOUDINARY_URL=cloudinary://...

# URLs
FRONTEND_URL=https://mediverse.alokkumarsahu.in
API_URL=https://api.mediverse.alokkumarsahu.in
```

---

## 10. Performance Budget

| Asset / Endpoint | Target |
|---|---|
| Landing page LCP | < 2s |
| Dashboard TTI | < 2s |
| Standard API (auth, profile) | < 300ms |
| Diabetes predict | < 100ms |
| OCR | < 2s |
| ECG / Skin | < 3s |
| X-ray | < 5s |
