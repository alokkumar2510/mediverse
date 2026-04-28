"""
MediVerse AI — Provider Abstraction Layer
=====================================================
Uses NVIDIA NIM as the primary AI provider, with a fallback to a secondary AI.
"""
from __future__ import annotations

import logging
from typing import Any

from app.core.config import settings
from app.ai.nim_provider import get_client as get_nim_client
from app.ai.secondary_client import get_client as get_secondary_client

logger = logging.getLogger("mediverse.ai_provider")

class AIFallbackProvider:
    """Provider abstraction layer that routes to NIM and falls back to secondary AI."""
    
    def __init__(self):
        self.nim_client = get_nim_client()
        self.secondary_client = get_secondary_client()

    async def generate_json(self, prompt: str, *, schema_hint: str = "") -> Any:
        if settings.nim_configured:
            try:
                return await self.nim_client.generate_json(prompt, schema_hint=schema_hint)
            except Exception as e:
                logger.error("NIM primary provider failed for generate_json: %s", e)
                logger.info("Falling back to secondary AI...")
        
        if settings.secondary_ai_configured:
            return await self.secondary_client.generate_json(prompt, schema_hint=schema_hint)
            
        raise RuntimeError("No AI providers configured or available.")

    async def generate_text(self, prompt: str) -> Any:
        if settings.nim_configured:
            try:
                return await self.nim_client.generate_text(prompt)
            except Exception as e:
                logger.error("NIM primary provider failed for generate_text: %s", e)
                logger.info("Falling back to secondary AI...")
        
        if settings.secondary_ai_configured:
            return await self.secondary_client.generate_text(prompt)
            
        raise RuntimeError("No AI providers configured or available.")

    async def analyze_image_json(
        self,
        image_bytes: bytes,
        prompt: str,
        mime_type: str = "image/jpeg",
        *,
        schema_hint: str = "",
    ) -> Any:
        if settings.nim_configured:
            try:
                return await self.nim_client.analyze_image_json(
                    image_bytes, prompt, mime_type, schema_hint=schema_hint
                )
            except Exception as e:
                logger.error("NIM primary provider failed for analyze_image_json: %s", e)
                logger.info("Falling back to secondary AI...")
        
        if settings.secondary_ai_configured:
            return await self.secondary_client.analyze_image_json(
                image_bytes, prompt, mime_type, schema_hint=schema_hint
            )
            
        raise RuntimeError("No AI providers configured or available.")

def get_ai_provider() -> AIFallbackProvider:
    return AIFallbackProvider()
