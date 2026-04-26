# MediVerse AI

> **AI-powered healthcare screening platform**  
> Domain: [mediverse.alokkumarsahu.in](https://mediverse.alokkumarsahu.in)

## Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind + shadcn/ui |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL (Supabase) |
| ML | ONNX Runtime + XGBoost + pytesseract |
| Infra | Docker + Cloudflare + Vercel + Azure Container Apps |

## Quick Start (Local Dev)

`ash
# 1. Clone and setup env
cp .env.example .env
# Fill in your values

# 2. Start services
docker-compose up -d

# 3. Backend
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 4. Frontend
cd frontend
npm install
npm run dev
`

## AI Modules
- X-ray analysis (ONNX ResNet/EfficientNet)
- ECG analysis (ONNX 1D-Conv)
- Skin condition detection (ONNX MobileNetV3)
- Diabetes risk prediction (XGBoost)
- Prescription OCR (pytesseract)
- Symptom checker (TF-IDF + Logistic)

## Docs
See docs/ for architecture, API reference, and deployment guides.
