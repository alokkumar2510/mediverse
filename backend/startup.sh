#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# MediVerse AI — Azure App Service Startup Script
# Set this as the "Startup Command" in Azure Portal:
#   bash /home/site/wwwroot/startup.sh
# ──────────────────────────────────────────────────────────────────────────────
set -e

echo "========================================"
echo "  MediVerse AI — Azure Startup"
echo "  ENV=${ENV:-production}"
echo "  PORT=${PORT:-8000}"
echo "========================================"

# Run Alembic DB migrations against Supabase
echo "[1/2] Running database migrations..."
alembic upgrade head
echo "      Migrations complete."

# Start gunicorn with uvicorn workers
echo "[2/2] Starting application server..."
exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers "${WORKERS:-2}" \
    --bind "0.0.0.0:${PORT:-8000}" \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --forwarded-allow-ips="*"
