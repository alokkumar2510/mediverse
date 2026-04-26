#!/usr/bin/env python3
"""
MediVerse AI — Production Health Monitor
=========================================
Lightweight uptime + latency monitoring script.
Run this as a cron job every 5 minutes:
    */5 * * * * /opt/venv/bin/python /scripts/monitor.py >> /var/log/mediverse_monitor.log 2>&1

Or deploy as a Render Cron Job:
    Schedule: */5 * * * *
    Command:  python scripts/monitor.py

Alerts are sent via webhook (Slack/Discord) or email.
"""

import asyncio
import httpx
import json
import os
import time
from datetime import datetime, timezone

# ── Config ─────────────────────────────────────────────────────────────────────
API_URL      = os.getenv("MONITOR_API_URL",     "https://api.mediverse.alokkumarsahu.in")
FRONTEND_URL = os.getenv("MONITOR_FRONTEND_URL", "https://mediverse.alokkumarsahu.in")
WEBHOOK_URL  = os.getenv("MONITOR_WEBHOOK_URL",  "")   # Slack / Discord webhook
TIMEOUT      = 10  # seconds

ENDPOINTS = [
    {"url": f"{API_URL}/health",          "name": "API Health"},
    {"url": f"{API_URL}/api/auth/me",     "name": "Auth endpoint",    "expect": [200, 401]},
    {"url": f"{API_URL}/api/diabetes/",   "name": "Diabetes module",  "expect": [200, 401, 405]},
    {"url": f"{API_URL}/api/ecg/",        "name": "ECG module",       "expect": [200, 401, 405]},
    {"url": f"{API_URL}/api/reports/",    "name": "Reports module",   "expect": [200, 401]},
    {"url": FRONTEND_URL,                 "name": "Frontend"},
]


async def check(client: httpx.AsyncClient, ep: dict) -> dict:
    start = time.monotonic()
    try:
        r = await client.get(ep["url"], timeout=TIMEOUT, follow_redirects=True)
        latency = int((time.monotonic() - start) * 1000)
        expected = ep.get("expect", [200])
        ok = r.status_code in expected
        return {
            "name":     ep["name"],
            "url":      ep["url"],
            "status":   r.status_code,
            "latency":  latency,
            "ok":       ok,
            "error":    None if ok else f"Unexpected status {r.status_code}",
        }
    except Exception as exc:
        latency = int((time.monotonic() - start) * 1000)
        return {
            "name":    ep["name"],
            "url":     ep["url"],
            "status":  None,
            "latency": latency,
            "ok":      False,
            "error":   str(exc),
        }


async def send_alert(results: list[dict]) -> None:
    if not WEBHOOK_URL:
        return
    failed = [r for r in results if not r["ok"]]
    if not failed:
        return
    text = f"🚨 *MediVerse Health Alert* — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}\n"
    for f in failed:
        text += f"  • `{f['name']}` — {f['error']} ({f['latency']}ms)\n"
    async with httpx.AsyncClient() as client:
        await client.post(WEBHOOK_URL, json={"text": text}, timeout=5)


async def main() -> None:
    ts = datetime.now(timezone.utc).isoformat()
    async with httpx.AsyncClient(headers={"User-Agent": "MediVerse-Monitor/1.0"}) as client:
        results = await asyncio.gather(*[check(client, ep) for ep in ENDPOINTS])

    all_ok  = all(r["ok"] for r in results)
    summary = {"timestamp": ts, "all_ok": all_ok, "checks": results}

    print(json.dumps(summary))  # Structured log line
    await send_alert(results)


if __name__ == "__main__":
    asyncio.run(main())
