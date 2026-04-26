# ──────────────────────────────────────────────────────────────────────────────
# MediVerse AI — Production Dockerfile (Backend)
# Multi-stage build: builder → slim runtime
# Target: Azure App Service (Linux) | Python 3.11
# ──────────────────────────────────────────────────────────────────────────────

ARG BUILD_DATE="unknown"
ARG GIT_SHA="unknown"

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgomp1 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps into an isolated venv (keeps stage 2 lean)
COPY requirements.txt .
RUN python -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Production Runtime ───────────────────────────────────────────────
FROM python:3.11-slim AS production

LABEL org.opencontainers.image.title="MediVerse AI Backend"
LABEL org.opencontainers.image.description="AI-powered medical screening API"
LABEL org.opencontainers.image.build-date="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${GIT_SHA}"

# Install runtime system libs only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgomp1 \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy venv from builder (avoids reinstalling)
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy app source (exclude venv, .env, mediverse.db via .dockerignore)
COPY . .

# Non-root user for security
RUN useradd -m -u 1000 appuser \
    && mkdir -p /app/ml_models /app/uploads /app/tmp \
    && chown -R appuser:appuser /app

USER appuser

# Azure App Service health probe — must be on /api/health or /health
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

EXPOSE 8000

# Startup: run DB migrations then start gunicorn
# Azure sets PORT automatically; fallback to 8000
CMD ["sh", "-c", "\
    echo '=== Running DB migrations ===' && \
    alembic upgrade head && \
    echo '=== Starting gunicorn ===' && \
    gunicorn app.main:app \
        --worker-class uvicorn.workers.UvicornWorker \
        --workers ${WORKERS:-2} \
        --bind 0.0.0.0:${PORT:-8000} \
        --timeout 120 \
        --keep-alive 5 \
        --access-logfile - \
        --error-logfile - \
        --log-level info \
        --forwarded-allow-ips='*' \
"]
