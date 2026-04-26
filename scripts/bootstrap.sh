#!/usr/bin/env bash
set -euo pipefail
echo "=== MediVerse Bootstrap ==="
cp .env.example .env
echo "Fill in .env values, then press Enter to continue..."
read -r
docker-compose up -d postgres redis
echo "Postgres + Redis running"
cd backend
python -m venv .venv
source .venv/bin/activate 2>/dev/null || .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
echo "Backend ready"
cd ../frontend
npm install
echo "Frontend ready — run: npm run dev"