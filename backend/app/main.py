"""
MediVerse AI — FastAPI Application Factory
Production-grade with: CORS, middleware, routers, error handlers, lifespan.
"""
import logging
import logging.config
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.config import settings
from app.middleware.rate_limiter import add_rate_limiter
from app.middleware.request_logger import RequestLoggerMiddleware
from app.routers import auth, user, reports, xray, ecg, skin, diabetes, ocr, symptom, admin, dashboard, notifications

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("mediverse")


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 MediVerse AI starting up (env=%s)", settings.ENV)

    # Startup: pre-load ML models in Wave 2
    # from app.ml import model_registry
    # await model_registry.load_all()

    yield

    # Shutdown: clean up connections
    from app.core.database import engine
    await engine.dispose()
    logger.info("🛑 MediVerse AI shut down cleanly")


# ── App factory ───────────────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        description="AI-powered medical screening API",
        docs_url=settings.docs_url,
        redoc_url=settings.redoc_url,
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware (order matters — outermost first) ───────────────────
    # 1. CORS — must be first so preflight OPTIONS pass through
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-Id"],
        expose_headers=["X-Request-Id", "X-Response-Time"],
    )

    # 2. GZip compression for responses > 1 KB
    app.add_middleware(GZipMiddleware, minimum_size=1024)

    # 3. Structured request logging
    app.add_middleware(RequestLoggerMiddleware)

    # 4. Rate limiting (slowapi)
    add_rate_limiter(app)

    # ── Routers ───────────────────────────────────────────────────────
    prefix = "/api"
    app.include_router(auth.router,     prefix=f"{prefix}/auth",     tags=["Auth"])
    app.include_router(user.router,     prefix=f"{prefix}/user",     tags=["User"])
    app.include_router(reports.router,  prefix=f"{prefix}/reports",  tags=["Reports"])
    app.include_router(xray.router,     prefix=f"{prefix}/xray",     tags=["X-Ray"])
    app.include_router(ecg.router,      prefix=f"{prefix}/ecg",      tags=["ECG"])
    app.include_router(skin.router,     prefix=f"{prefix}/skin",     tags=["Skin"])
    app.include_router(diabetes.router, prefix=f"{prefix}/diabetes", tags=["Diabetes"])
    app.include_router(ocr.router,      prefix=f"{prefix}/ocr",      tags=["OCR"])
    app.include_router(symptom.router,  prefix=f"{prefix}/symptom",  tags=["Symptom"])
    app.include_router(admin.router,         prefix=f"{prefix}/admin",         tags=["Admin"])
    app.include_router(dashboard.router,     prefix=f"{prefix}/dashboard",     tags=["Dashboard"])
    app.include_router(notifications.router, prefix=f"{prefix}/notifications",  tags=["Notifications"])

    # ── Health endpoints ──────────────────────────────────────────────
    # Root /health for Azure App Service probe (no /api prefix)
    @app.get("/health", tags=["Health"], include_in_schema=False)
    async def health_root() -> dict[str, Any]:
        return {"status": "ok", "service": settings.APP_NAME, "version": settings.VERSION}

    @app.get("/api/health", tags=["Health"], include_in_schema=True)
    async def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "service": settings.APP_NAME,
            "version": settings.VERSION,
            "env": settings.ENV,
        }


    @app.get("/api/health/db", tags=["Health"])
    async def health_db() -> dict[str, Any]:
        """Check database connectivity."""
        from sqlalchemy import text
        from app.core.database import AsyncSessionLocal
        try:
            async with AsyncSessionLocal() as session:
                await session.execute(text("SELECT 1"))
            return {"status": "ok", "database": "connected"}
        except Exception as exc:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"status": "error", "database": str(exc)},
            )

    @app.get("/api/health/ai", tags=["Health"])
    async def health_ai() -> dict[str, Any]:
        """Check AI provider availability for all modules."""
        import os
        key = os.environ.get("NVIDIA_NIM_API_KEY", "")
        configured = bool(key)
        modules = ["diabetes", "symptom", "skin", "xray", "ecg", "ocr"]
        return {
            "status":          "ready" if configured else "degraded",
            "provider":        "NVIDIA NIM (Fallback to Secondary AI)",
            "mode":            "temporary_ai_bridge",
            "api_key":         "configured" if configured else "MISSING",
            "modules_powered": modules,
            "fallback":        "rule-based heuristics when AI unavailable",
            "custom_models":   "pending training — will replace AI when ready",
        }


    # ── Global exception handlers ─────────────────────────────────────
    @app.exception_handler(ValidationError)
    async def pydantic_validation_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "errors": [
                    {"code": "validation_error", "message": err["msg"], "field": ".".join(str(l) for l in err["loc"])}
                    for err in exc.errors()
                ],
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "errors": [{"code": "internal_server_error", "message": "An unexpected error occurred"}],
            },
        )

    return app


# ── Application instance (used by uvicorn/gunicorn) ───────────────────────────
app = create_app()
