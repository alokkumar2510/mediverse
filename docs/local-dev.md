# Local Development Guide

## Prerequisites
- Docker Desktop
- Node.js 20+
- Python 3.11+

## Quick Start
```bash
bash scripts/bootstrap.sh
```

## Manual Steps
```bash
# 1. Start backing services
docker-compose up -d postgres redis

# 2. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install
npm run dev
```

## Service URLs
| Service   | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| API       | http://localhost:8000        |
| API Docs  | http://localhost:8000/api/docs |