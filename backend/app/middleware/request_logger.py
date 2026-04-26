"""
Request Logger Middleware
Logs every request: method, path, status code, latency, user IP.
Writes async to usage_logs table via a background task.
"""
import time
import uuid
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger("mediverse.access")


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()
        request_id = str(uuid.uuid4())[:8]

        # Attach request_id so handlers can reference it
        request.state.request_id = request_id

        try:
            response = await call_next(request)
        except Exception as exc:
            logger.exception(
                "Unhandled exception",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                },
            )
            raise exc

        latency_ms = round((time.perf_counter() - start_time) * 1000)
        status_code = response.status_code

        # Structured log line
        logger.info(
            "%s %s %s %dms [%s]",
            request.method,
            request.url.path,
            status_code,
            latency_ms,
            request_id,
        )

        # Attach headers for observability
        response.headers["X-Request-Id"] = request_id
        response.headers["X-Response-Time"] = f"{latency_ms}ms"

        # TODO Wave 2: emit usage_log record via background task
        # background_tasks.add_task(log_to_db, ...)

        return response
