"""
MediVerse AI — NVIDIA NIM API Client
=====================================================
Uses the `openai` package to connect to NVIDIA NIM endpoints.

Features:
  • Singleton per-process
  • Configurable timeout + retry with exponential back-off
  • Rate-limit guard
  • Structured JSON response parsing
  • Vision (multimodal) support
"""
from __future__ import annotations

import asyncio
import base64
import json
import logging
import time
from typing import Any

from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError, APITimeoutError

logger = logging.getLogger("mediverse.nim")

from app.core.config import settings

_API_KEY     = settings.NVIDIA_NIM_API_KEY
_MODEL_TEXT  = settings.NIM_MODEL_TEXT
_MODEL_VIS   = settings.NIM_MODEL_VISION
_MAX_TOKENS  = settings.NIM_MAX_OUTPUT_TOKENS
_TEMP        = settings.NIM_TEMPERATURE
_TIMEOUT     = settings.NIM_TIMEOUT_SEC
_MAX_RETRIES = settings.NIM_MAX_RETRIES
_RPM_LIMIT   = settings.NIM_RPM


class _RateLimiter:
    """Token-bucket rate limiter."""
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


class NIMClient:
    """Singleton NIM client with retry + rate-limit."""

    _instance:    "NIMClient | None" = None
    _initialized: bool = False

    def __new__(cls) -> "NIMClient":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        if not _API_KEY:
            logger.warning("NVIDIA_NIM_API_KEY not set — all NIM calls will fail.")
        
        self._client = AsyncOpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=_API_KEY,
            timeout=_TIMEOUT,
        )
        self._rl     = _RateLimiter(_RPM_LIMIT)
        self._initialized = True
        logger.info("✅ NVIDIA NIM client ready (text=%s  vision=%s)", _MODEL_TEXT, _MODEL_VIS)

    async def generate_json(
        self,
        prompt: str,
        *,
        schema_hint: str = "",
    ) -> Any: # Returns AIResponse-like object
        full = prompt
        if schema_hint:
            full += f"\n\nRespond ONLY with a valid JSON object matching this schema:\n{schema_hint}"
        
        messages = [{"role": "user", "content": full}]
        return await self._call(_MODEL_TEXT, messages, json_mode=True)

    async def generate_text(self, prompt: str) -> Any:
        messages = [{"role": "user", "content": prompt}]
        return await self._call(_MODEL_TEXT, messages, json_mode=False)

    async def analyze_image_json(
        self,
        image_bytes: bytes,
        prompt: str,
        mime_type: str = "image/jpeg",
        *,
        schema_hint: str = "",
    ) -> Any:
        full = prompt
        if schema_hint:
            full += f"\n\nRespond ONLY with a valid JSON object matching this schema:\n{schema_hint}"

        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        image_url = f"data:{mime_type};base64,{b64_image}"

        content = [
            {"type": "text", "text": full},
            {
                "type": "image_url",
                "image_url": {"url": image_url}
            }
        ]
        
        messages = [{"role": "user", "content": content}]
        return await self._call(_MODEL_VIS, messages, json_mode=True)

    async def _call(
        self,
        model: str,
        messages: list[dict],
        *,
        json_mode: bool,
    ) -> Any:
        await self._rl.acquire()

        from app.ai.secondary_client import AIResponse  # Reusing the response struct

        last_exc: Exception | None = None

        for attempt in range(1, _MAX_RETRIES + 1):
            t0 = time.monotonic()
            try:
                resp = await self._client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=_TEMP,
                    max_tokens=_MAX_TOKENS,
                    # NIM currently supports typical OpenAI payload
                )
                latency = (time.monotonic() - t0) * 1000
                
                raw_text = resp.choices[0].message.content or ""
                raw_text = raw_text.strip()

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

                return AIResponse(
                    text          = raw_text,
                    data          = parsed,
                    model         = model,
                    prompt_tokens = resp.usage.prompt_tokens if resp.usage else 0,
                    output_tokens = resp.usage.completion_tokens if resp.usage else 0,
                    latency_ms    = round(latency, 1),
                    ai_provider   = "nim"
                )

            except RateLimitError as exc:
                wait = 2 ** attempt
                logger.warning(
                    "NIM rate-limited/unavailable (attempt %d/%d) — retry in %ds: %s",
                    attempt, _MAX_RETRIES, wait, exc,
                )
                last_exc = exc
                await asyncio.sleep(wait)
            except (APITimeoutError, asyncio.TimeoutError) as exc:
                logger.warning(
                    "NIM timeout (attempt %d/%d, %.0fs)", attempt, _MAX_RETRIES, _TIMEOUT
                )
                last_exc = exc
                await asyncio.sleep(1)
            except (APIError, APIConnectionError) as exc:
                logger.exception("NIM API error (attempt %d): %s", attempt, exc)
                last_exc = exc
                # Depending on the error, we might want to break or retry. 5xx usually retries.
                if hasattr(exc, "status_code") and exc.status_code and exc.status_code >= 500:
                    wait = 2 ** attempt
                    await asyncio.sleep(wait)
                else:
                    break
            except Exception as exc:
                logger.exception("NIM unexpected error (attempt %d): %s", attempt, exc)
                last_exc = exc
                break   # don't retry unknown errors

        raise RuntimeError(
            f"NIM call failed after {_MAX_RETRIES} attempts: {last_exc}"
        ) from last_exc


def get_client() -> NIMClient:
    return NIMClient()
