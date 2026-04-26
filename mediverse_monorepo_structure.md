# MediVerse AI — Final Monorepo Structure
**Source of Truth:** MediVerse_Architecture_Blueprint.md v1.0  
**Owner:** Alok | **Root:** `e:\Mediverse\`  
**Stack:** Next.js 14 · FastAPI · PostgreSQL · ONNX · Docker · Vercel · Azure

---

## 1. Full Directory Tree

```
mediverse/                                  ← monorepo root (e:\Mediverse)
│
├── frontend/                               ← Next.js 14 App Router (TS + Tailwind + shadcn/ui)
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                    ← Landing page  /
│   │   │   ├── about/page.tsx
│   │   │   ├── features/page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   └── contact/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (protected)/
│   │   │   ├── layout.tsx                  ← Auth guard wrapper
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── xray/page.tsx
│   │   │   ├── ecg/page.tsx
│   │   │   ├── skin/page.tsx
│   │   │   ├── diabetes/page.tsx
│   │   │   ├── prescription/page.tsx
│   │   │   ├── symptoms/page.tsx
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx                ← Report list
│   │   │   │   └── [id]/page.tsx           ← Single report
│   │   │   ├── settings/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                  ← Admin role guard
│   │   │   ├── admin/page.tsx
│   │   │   ├── admin/users/page.tsx
│   │   │   ├── admin/analytics/page.tsx
│   │   │   └── admin/logs/page.tsx
│   │   ├── api/                            ← Next.js route handlers (thin proxies only)
│   │   │   └── health/route.ts
│   │   ├── layout.tsx                      ← Root layout (fonts, theme provider)
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                             ← shadcn/ui primitives (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── DashboardShell.tsx
│   │   ├── modules/
│   │   │   ├── xray/
│   │   │   │   ├── XrayUploader.tsx
│   │   │   │   └── XrayResult.tsx
│   │   │   ├── ecg/
│   │   │   │   ├── EcgUploader.tsx
│   │   │   │   └── EcgResult.tsx
│   │   │   ├── skin/
│   │   │   │   ├── SkinUploader.tsx
│   │   │   │   └── SkinResult.tsx
│   │   │   ├── diabetes/
│   │   │   │   ├── DiabetesForm.tsx
│   │   │   │   └── DiabetesResult.tsx
│   │   │   ├── prescription/
│   │   │   │   ├── PrescriptionUploader.tsx
│   │   │   │   └── PrescriptionResult.tsx
│   │   │   └── symptoms/
│   │   │       ├── SymptomsInput.tsx
│   │   │       └── SymptomsResult.tsx
│   │   ├── reports/
│   │   │   ├── ReportCard.tsx
│   │   │   ├── ReportTable.tsx
│   │   │   └── ReportDetail.tsx
│   │   ├── dashboard/
│   │   │   ├── StatWidget.tsx
│   │   │   ├── RecentReports.tsx
│   │   │   └── ModuleGrid.tsx
│   │   └── shared/
│   │       ├── FileDropzone.tsx            ← Reusable file uploader
│   │       ├── ConfidenceBar.tsx           ← AI confidence display
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useUpload.ts
│   │   ├── useReports.ts
│   │   └── useToast.ts
│   │
│   ├── lib/
│   │   ├── api.ts                          ← Axios/fetch client (base URL from env)
│   │   ├── auth.ts                         ← Token storage, refresh logic
│   │   ├── utils.ts                        ← cn(), formatDate(), truncate()
│   │   └── validators.ts                   ← Zod schemas for forms
│   │
│   ├── stores/
│   │   ├── authStore.ts                    ← Zustand: user, token, isLoggedIn
│   │   ├── uiStore.ts                      ← Zustand: sidebar, theme, modals
│   │   └── reportStore.ts                  ← Zustand: report cache
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── reports.ts
│   │   ├── modules.ts                      ← Per-module result types
│   │   └── api.ts                          ← Generic API response envelope
│   │
│   ├── public/
│   │   ├── icons/
│   │   ├── images/
│   │   └── favicon.ico
│   │
│   ├── .env.local.example
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── components.json                     ← shadcn/ui config
│   └── package.json
│
├── backend/                                ← FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── main.py                         ← App factory, lifespan, CORS, router mount
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py                   ← Pydantic BaseSettings (reads .env)
│   │   │   ├── database.py                 ← SQLAlchemy async engine + get_db()
│   │   │   ├── security.py                 ← JWT create/verify, bcrypt hash/verify
│   │   │   └── deps.py                     ← get_current_user, require_admin
│   │   │
│   │   ├── models/                         ← SQLAlchemy ORM (1 file = 1 table)
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── report.py
│   │   │   ├── upload.py
│   │   │   ├── feedback.py
│   │   │   ├── usage_log.py
│   │   │   ├── notification.py
│   │   │   └── subscription.py
│   │   │
│   │   ├── schemas/                        ← Pydantic request / response schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── report.py
│   │   │   ├── xray.py
│   │   │   ├── ecg.py
│   │   │   ├── skin.py
│   │   │   ├── diabetes.py
│   │   │   ├── ocr.py
│   │   │   └── symptom.py
│   │   │
│   │   ├── routers/                        ← Thin HTTP layer — delegates to services
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                     ← /api/auth/*
│   │   │   ├── user.py                     ← /api/user/*
│   │   │   ├── xray.py                     ← /api/xray/*
│   │   │   ├── ecg.py                      ← /api/ecg/*
│   │   │   ├── skin.py                     ← /api/skin/*
│   │   │   ├── diabetes.py                 ← /api/diabetes/*
│   │   │   ├── ocr.py                      ← /api/ocr/*
│   │   │   ├── symptom.py                  ← /api/symptom/*
│   │   │   ├── reports.py                  ← /api/reports/*
│   │   │   └── admin.py                    ← /api/admin/*
│   │   │
│   │   ├── services/                       ← Business logic — fat services, thin routers
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── user_service.py
│   │   │   ├── report_service.py
│   │   │   ├── xray_service.py
│   │   │   ├── ecg_service.py
│   │   │   ├── skin_service.py
│   │   │   ├── diabetes_service.py
│   │   │   ├── ocr_service.py
│   │   │   └── symptom_service.py
│   │   │
│   │   ├── ml/                             ← ML inference engines (load-once singletons)
│   │   │   ├── __init__.py
│   │   │   ├── base.py                     ← Abstract: load(), preprocess(), infer(), postprocess()
│   │   │   ├── xray_model.py               ← ONNX Runtime — ResNet/EfficientNet
│   │   │   ├── ecg_model.py                ← ONNX Runtime — 1D-Conv
│   │   │   ├── skin_model.py               ← ONNX Runtime — MobileNetV3
│   │   │   ├── diabetes_model.py           ← XGBoost native
│   │   │   ├── ocr_model.py                ← pytesseract + post-processing
│   │   │   └── symptom_model.py            ← TF-IDF + Logistic / scikit-learn
│   │   │
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   ├── rate_limiter.py             ← slowapi per-IP + per-user
│   │   │   ├── request_logger.py           ← Writes to usage_logs table
│   │   │   └── cors.py                     ← CORS whitelist config
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── file_validator.py           ← MIME check, size cap 10 MB
│   │       ├── image_helpers.py            ← Resize, normalize, base64 encode
│   │       └── formatters.py              ← Response formatters, date helpers
│   │
│   ├── migrations/                         ← Alembic
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   │
│   ├── tests/
│   │   ├── conftest.py                     ← Pytest fixtures, test DB setup
│   │   ├── test_auth.py
│   │   ├── test_diabetes.py
│   │   ├── test_ocr.py
│   │   ├── test_reports.py
│   │   └── test_xray.py
│   │
│   ├── workers/                            ← Background tasks (optional Celery / ARQ)
│   │   ├── __init__.py
│   │   └── report_worker.py               ← Async report generation queue
│   │
│   ├── .env.example
│   ├── alembic.ini
│   ├── Dockerfile
│   ├── pyproject.toml                      ← Dependencies (uv / pip)
│   └── requirements.txt
│
├── ml/                                     ← Raw ML assets (separate from serving code)
│   ├── models/
│   │   ├── xray/
│   │   │   ├── xray_v1.onnx
│   │   │   └── metadata.json
│   │   ├── ecg/
│   │   │   ├── ecg_v1.onnx
│   │   │   └── metadata.json
│   │   ├── skin/
│   │   │   ├── skin_v1.onnx
│   │   │   └── metadata.json
│   │   ├── diabetes/
│   │   │   ├── diabetes_v1.json            ← XGBoost model JSON
│   │   │   └── metadata.json
│   │   └── symptom/
│   │       ├── tfidf_vectorizer.pkl
│   │       ├── symptom_clf.pkl
│   │       └── metadata.json
│   │
│   ├── datasets/
│   │   ├── README.md                       ← Dataset sources, licenses
│   │   ├── xray/                           ← NIH ChestX-ray14 references
│   │   ├── skin/                           ← HAM10000 references
│   │   └── diabetes/
│   │       └── pima_sample.csv
│   │
│   ├── training/
│   │   ├── xray_train.py
│   │   ├── ecg_train.py
│   │   ├── skin_train.py
│   │   ├── diabetes_train.py
│   │   └── symptom_train.py
│   │
│   ├── checkpoints/                        ← PyTorch .pt files (gitignored)
│   │   └── .gitkeep
│   │
│   └── exports/                            ← Final .onnx / .json exports (gitignored)
│       └── .gitkeep
│
├── shared/                                 ← Cross-package shared constants / types
│   ├── constants/
│   │   ├── modules.ts                      ← Module slugs: "xray"|"ecg"|"skin"...
│   │   └── api-routes.ts                   ← API path constants (used in frontend lib/api.ts)
│   └── types/
│       └── common.ts                       ← Shared interfaces (if needed)
│
├── infra/
│   ├── docker/
│   │   ├── backend.Dockerfile              ← Production multi-stage FastAPI image
│   │   └── nginx.conf                      ← Optional reverse proxy (local dev)
│   ├── azure/
│   │   ├── container-apps.yml              ← Azure Container Apps deployment config
│   │   └── keyvault-refs.md                ← Secret name reference doc
│   ├── vercel/
│   │   └── vercel.json                     ← Rewrites, headers, env mapping
│   └── cloudflare/
│       └── dns-records.md                  ← DNS record reference (A, CNAME)
│
├── .github/
│   └── workflows/
│       ├── ci-backend.yml                  ← Lint + pytest on PR to main
│       ├── ci-frontend.yml                 ← Type-check + build on PR to main
│       ├── deploy-backend.yml              ← Push to main → Azure Container Apps
│       └── deploy-frontend.yml             ← Push to main → Vercel (via CLI)
│
├── scripts/
│   ├── bootstrap.sh                        ← One-command dev env setup
│   ├── seed_db.py                          ← Insert demo user + sample reports
│   ├── export_model.py                     ← PyTorch → ONNX export helper
│   └── check_env.py                        ← Validate all required env vars present
│
├── docs/
│   ├── architecture.md                     ← Links to MediVerse_Architecture_Blueprint.md
│   ├── api-reference.md                    ← Auto-generated from FastAPI /openapi.json
│   ├── ml-models.md                        ← Model cards, accuracy, datasets
│   ├── deployment.md                       ← Step-by-step Vercel + Azure deploy guide
│   ├── local-dev.md                        ← How to run the stack locally
│   └── conventions.md                      ← Naming rules, code style, PR flow
│
├── docker-compose.yml                      ← Local dev: FastAPI + Redis + Postgres
├── docker-compose.prod.yml                 ← Production-like local test
├── .env.example                            ← All env vars with safe defaults
├── .gitignore
├── .editorconfig
└── README.md
```

---

## 2. Purpose of Each Top-Level Folder

| Folder | Purpose |
|--------|---------|
| `frontend/` | Next.js 14 App Router SPA — all UI, routes, hooks, stores |
| `backend/` | FastAPI monolith — auth, AI module APIs, DB, middleware |
| `ml/` | Raw ML assets: training scripts, model files, datasets, exports |
| `shared/` | Tiny shared constants/types used by both frontend and backend |
| `infra/` | Deployment configs: Docker, Azure, Vercel, Cloudflare |
| `.github/` | CI/CD pipelines: lint, test, build, deploy workflows |
| `scripts/` | Dev automation: bootstrap, seed, model export, env validation |
| `docs/` | Human-readable docs: architecture, API ref, deployment guide |

---

## 3. Important Conventions

### File Naming
| Context | Convention | Example |
|---------|-----------|---------|
| Next.js pages | lowercase, kebab in folder | `forgot-password/page.tsx` |
| React components | PascalCase `.tsx` | `DiabetesForm.tsx` |
| Hooks | camelCase, `use` prefix | `useAuth.ts` |
| Stores | camelCase, `Store` suffix | `authStore.ts` |
| Python modules | snake_case | `diabetes_service.py` |
| Python classes | PascalCase | `DiabetesModel` |
| DB tables | snake_case plural | `usage_logs` |
| API routes | kebab-case | `/api/auth/forgot-password` |
| Env vars | SCREAMING_SNAKE_CASE | `JWT_SECRET` |

### Architecture Rules
1. **Thin routers, fat services** — routers only parse HTTP, services own all logic
2. **One file = one concern** — no mega-files; each model, schema, router is isolated
3. **ML models load once** — use module-level singletons, not per-request loading
4. **No raw SQL** — SQLAlchemy ORM only (parameterized, injection-safe)
5. **Env-driven config** — zero hardcoded secrets; everything in `.env` / Key Vault
6. **Async everywhere** — all FastAPI routes and DB calls must be `async def`
7. **Type everything** — Python 3.11 type hints on all function signatures; strict TS

### Gitignore Must Include
```
# Python
__pycache__/
*.pyc
.venv/
.env

# ML (large files)
ml/checkpoints/
ml/exports/
*.onnx
*.pt
*.pkl

# Node
node_modules/
.next/
.env.local

# Infra secrets
infra/azure/*.secret
```

---

## 4. Naming Rules (Summary)

```
Component files   →  PascalCase.tsx          (XrayUploader.tsx)
Page files        →  lowercase/page.tsx      (xray/page.tsx)
Hook files        →  useCamelCase.ts         (useUpload.ts)
Store files       →  camelCaseStore.ts       (authStore.ts)
Type files        →  camelCase.ts            (modules.ts)
Python services   →  snake_case_service.py   (xray_service.py)
Python models     →  snake_case.py           (report.py)
Python routers    →  snake_case.py           (xray.py)
ML model files    →  {module}_v{n}.onnx      (xray_v1.onnx)
Docker files      →  {service}.Dockerfile    (backend.Dockerfile)
GH Actions        →  {action}-{service}.yml  (ci-backend.yml)
```

---

## 5. What to Build First (Implementation Order)

> Follow the blueprint's Stage 1 → Stage 4 progression exactly.

### 🥇 Wave 1 — Foundation (Build These First)
```
Priority 1:  docker-compose.yml + .env.example
Priority 2:  backend/app/core/ (config, database, security, deps)
Priority 3:  backend/app/models/ (all 7 tables)
Priority 4:  backend/migrations/ (Alembic — 001_initial_schema)
Priority 5:  backend/app/routers/auth.py + schemas/auth.py + services/auth_service.py
Priority 6:  frontend/ scaffold (next.js init, tailwind, shadcn)
Priority 7:  frontend/app/(auth)/ — login + signup pages
Priority 8:  frontend/stores/authStore.ts + lib/auth.ts
```

### 🥈 Wave 2 — Dashboard + First AI Module
```
Priority 9:   frontend/app/(protected)/dashboard/
Priority 10:  backend/app/ml/diabetes_model.py
Priority 11:  backend/app/routers/diabetes.py + services/diabetes_service.py
Priority 12:  frontend/components/modules/diabetes/
Priority 13:  backend/app/ml/ocr_model.py
Priority 14:  backend/app/routers/ocr.py + frontend/components/modules/prescription/
Priority 15:  Reports CRUD (backend/app/routers/reports.py + frontend/app/(protected)/reports/)
```

### 🥉 Wave 3 — Remaining AI Modules + Admin
```
Priority 16:  Skin module (ONNX)
Priority 17:  Symptom checker (NLP)
Priority 18:  ECG module (ONNX)
Priority 19:  X-ray module (ONNX + heatmap)
Priority 20:  Admin console pages + backend/app/routers/admin.py
```

### 🚀 Wave 4 — Production Deploy
```
Priority 21:  .github/workflows/ (CI + CD pipelines)
Priority 22:  infra/azure/ (Container Apps config)
Priority 23:  infra/vercel/vercel.json
Priority 24:  infra/cloudflare/ (DNS setup)
Priority 25:  ml/training/ + ml/exports/ (real model files)
```

---

## 6. Critical Files to Create Immediately

| File | Why It's Critical |
|------|------------------|
| `docker-compose.yml` | Unblocks local Postgres + Redis dev environment |
| `.env.example` | Every dev/agent knows what vars are needed |
| `backend/app/core/config.py` | All other backend files import from here |
| `backend/app/core/database.py` | Required by every service and model |
| `backend/app/main.py` | App factory — nothing runs without this |
| `frontend/next.config.ts` | Required for API proxy config |
| `frontend/lib/api.ts` | Every frontend module calls this |
| `README.md` | Onboarding + how-to-run for AI agents |

---

> [!IMPORTANT]
> **Do NOT** put ML training code inside `backend/`. Training belongs in `ml/training/`.  
> `backend/app/ml/` contains **inference-only** code that loads pre-exported models.

> [!TIP]
> The `shared/` folder is intentionally minimal. Don't over-share — only put things that are **genuinely** used by both frontend and backend (e.g., module slug constants).

> [!NOTE]
> All `.onnx`, `.pt`, `.pkl` model files are **gitignored**. They should be stored in Azure Blob Storage or Cloudinary and downloaded at container startup via a `scripts/download_models.sh` script (add in Wave 4).
