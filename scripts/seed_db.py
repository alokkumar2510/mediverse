"""Seed database with demo user and sample reports."""
import asyncio
import sys
sys.path.insert(0, "backend")
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password


async def seed():
    async with AsyncSessionLocal() as db:
        print("TODO: insert demo user + sample reports")
        print("Seeded.")


if __name__ == "__main__":
    asyncio.run(seed())