#!/usr/bin/env pwsh
# MediVerse Backend — Dev Startup Script (Windows PowerShell)
# Usage: .\dev.ps1

Write-Host "🚀 Starting MediVerse AI backend..." -ForegroundColor Cyan

# 1. Check .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env — please edit DATABASE_URL and JWT_SECRET before starting." -ForegroundColor Green
    Write-Host "   Then re-run: .\dev.ps1" -ForegroundColor Gray
    exit 1
}

# 2. Activate virtual env if present
if (Test-Path ".venv\Scripts\Activate.ps1") {
    Write-Host "🐍 Activating virtual environment..." -ForegroundColor Cyan
    . .\.venv\Scripts\Activate.ps1
}

# 3. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt --quiet

# 4. Run database migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
python -m alembic upgrade head

# 5. Start dev server
Write-Host "✅ Starting uvicorn on http://localhost:8000" -ForegroundColor Green
Write-Host "   API docs: http://localhost:8000/api/docs" -ForegroundColor Gray
uvicorn app.main:app --reload --port 8000 --log-level info
