"""
MediVerse AI — Gemini API Client  (google-genai SDK)
=====================================================
Uses the new `google.genai` package (replaces deprecated `google.generativeai`).

Features:
  • Singleton per-process (no re-auth overhead)
  • Configurable timeout + retry with exponential back-off
  • Rate-limit guard (GEMINI_RPM env var, default 15 RPM for free tier)
  • Structured JSON response parsing (strips markdown fences)
  • Vision (multimodal) support for Skin / X-ray / ECG image modules
  • Per-call token cost estimate in response metadata
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Any

from google import genai
from google.genai import types
from google.genai.errors import APIError

logger = logging.getLogger("mediverse.gemini")

# ── Config from environment ────────────────────────────────────────────────────
from app.core.config import settings

_API_KEY     = settings.GEMINI_API_KEY
_MODEL_TEXT  = settings.GEMINI_MODEL_TEXT
_MODEL_VIS   = settings.GEMINI_MODEL_VISION
_MAX_TOKENS  = settings.GEMINI_MAX_OUTPUT_TOKENS
_TEMP        = settings.GEMINI_TEMPERATURE
_TIMEOUT     = settings.GEMINI_TIMEOUT_SEC
_MAX_RETRIES = settings.GEMINI_MAX_RETRIES
_RPM_LIMIT   = settings.GEMINI_RPM


@dataclass
class GeminiResponse:
    text: str
    data: dict | None = None         # parsed JSON (if requested)
    model: str = ""
    prompt_tokens: int = 0
    output_tokens: int = 0
    latency_ms: float = 0.0
    ai_provider: str = "gemini"

    @property
    def cost_estimate_usd(self) -> float:
        """Flash pricing ~$0.075/1M input + $0.30/1M output tokens."""
        return round(
            self.prompt_tokens * 0.000075 / 1000
            + self.output_tokens * 0.000300 / 1000,
            6,
        )


class _RateLimiter:
    """Token-bucket rate limiter (per-process, not distributed)."""

    def __init__(self, rpm: int) -> None:
        self._interval = 60.0 / max(rpm, 1)
        self._last     = 0.0
        self._lock     = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now  = time.monotonic()
            wait = self._interval - (now - self._last)
            if wait > 0:
                await asyncio.sleep(wait)
            self._last = time.monotonic()


class GeminiClient:
    """Singleton Gemini client (google-genai SDK) with retry + rate-limit."""

    _instance:    "GeminiClient | None" = None
    _initialized: bool = False

    def __new__(cls) -> "GeminiClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        if not _API_KEY:
            logger.warning("GEMINI_API_KEY not set — all Gemini calls will fail.")
        self._client = genai.Client(api_key=_API_KEY)
        self._rl     = _RateLimiter(_RPM_LIMIT)
        self._initialized = True
        logger.info("✅ Gemini client ready (text=%s  vision=%s)", _MODEL_TEXT, _MODEL_VIS)

    # ── Public helpers ──────────────────────────────────────────────────────────

    async def generate_json(
        self,
        prompt: str,
        *,
        schema_hint: str = "",
    ) -> GeminiResponse:
        """Text prompt → expects JSON response."""
        full = prompt
        if schema_hint:
            full += f"\n\nRespond ONLY with a valid JSON object matching this schema:\n{schema_hint}"
        return await self._call(_MODEL_TEXT, [full], json_mode=True)

    async def generate_text(self, prompt: str) -> GeminiResponse:
        """Text prompt → plain text response."""
        return await self._call(_MODEL_TEXT, [prompt], json_mode=False)

    async def analyze_image_json(
        self,
        image_bytes: bytes,
        prompt: str,
        mime_type: str = "image/jpeg",
        *,
        schema_hint: str = "",
    ) -> GeminiResponse:
        """Image + text prompt → expects JSON response (multimodal)."""
        full = prompt
        if schema_hint:
            full += f"\n\nRespond ONLY with a valid JSON object matching this schema:\n{schema_hint}"

        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        contents   = [image_part, full]
        return await self._call(_MODEL_VIS, contents, json_mode=True)

    # ── Core call with retry ────────────────────────────────────────────────────

    async def _call(
        self,
        model: str,
        contents: list[Any],
        *,
        json_mode: bool,
    ) -> GeminiResponse:
        await self._rl.acquire()

        config = types.GenerateContentConfig(
            temperature        = _TEMP,
            max_output_tokens  = _MAX_TOKENS,
            response_mime_type = "application/json" if json_mode else "text/plain",
        )

        last_exc: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            t0 = time.monotonic()
            try:
                resp = await asyncio.wait_for(
                    self._client.aio.models.generate_content(
                        model    = model,
                        contents = contents,
                        config   = config,
                    ),
                    timeout=_TIMEOUT,
                )
                latency = (time.monotonic() - t0) * 1000

                raw_text = resp.text.strip() if resp.text else ""

                parsed: dict | None = None
                if json_mode and raw_text:
                    try:
                        clean = raw_text
                        if clean.startswith("```"):
                            parts = clean.split("```", 2)
                            clean = parts[1]
                            if clean.startswith("json"):
                                clean = clean[4:]
                            clean = clean.rsplit("```", 1)[0].strip()
                        parsed = json.loads(clean)
                    except json.JSONDecodeError as e:
                        logger.warning("JSON parse failed: %s | raw: %.200s", e, raw_text)

                usage = getattr(resp, "usage_metadata", None)
                return GeminiResponse(
                    text          = raw_text,
                    data          = parsed,
                    model         = model,
                    prompt_tokens = getattr(usage, "prompt_token_count",      0) or 0,
                    output_tokens = getattr(usage, "candidates_token_count",  0) or 0,
                    latency_ms    = round(latency, 1),
                )

            except APIError as exc:
                if exc.code in (429, 503):
                    wait = 2 ** attempt
                    logger.warning(
                        "Gemini rate-limited/unavailable (attempt %d/%d) — retry in %ds: %s",
                        attempt, _MAX_RETRIES, wait, exc,
                    )
                    last_exc = exc
                    await asyncio.sleep(wait)
                else:
                    logger.exception("Gemini API error (attempt %d): %s", attempt, exc)
                    last_exc = exc
                    break

            except asyncio.TimeoutError:
                logger.warning(
                    "Gemini timeout (attempt %d/%d, %.0fs)", attempt, _MAX_RETRIES, _TIMEOUT
                )
                last_exc = TimeoutError(f"Gemini timed out after {_TIMEOUT}s")
                await asyncio.sleep(1)

            except Exception as exc:
                logger.exception("Gemini unexpected error (attempt %d): %s", attempt, exc)
                last_exc = exc
                break   # don't retry unknown errors

        raise RuntimeError(
            f"Gemini call failed after {_MAX_RETRIES} attempts: {last_exc}"
        ) from last_exc


# ── Module-level singleton accessor ───────────────────────────────────────────
def get_client() -> GeminiClient:
    """Return the singleton GeminiClient. Thread-safe (asyncio loop required)."""
    return GeminiClient()
