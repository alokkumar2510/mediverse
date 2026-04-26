#!/usr/bin/env python3
"""
MediVerse AI — Production Database Setup Script
Run this ONCE after creating the Supabase project to apply all migrations.

Usage:
    pip install alembic asyncpg sqlalchemy pydantic-settings
    python scripts/setup_db.py
"""
import asyncio
import os
import sys

# Must set DATABASE_URL before running
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set.")
    print("Example:")
    print("  export DATABASE_URL=postgresql+asyncpg://postgres.XXXX:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres")
    sys.exit(1)

# Ensure we're in the backend directory
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(script_dir, "..", "backend")
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

import subprocess

def run(cmd: list[str]) -> int:
    print(f"\n  $ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=backend_dir)
    return result.returncode

def main():
    print("=" * 60)
    print("  MediVerse AI — Database Setup")
    print(f"  Target: {DATABASE_URL[:50]}...")
    print("=" * 60)

    print("\n[1/2] Running Alembic migrations...")
    rc = run(["alembic", "upgrade", "head"])
    if rc != 0:
        print("ERROR: Migration failed. Check DATABASE_URL and network access.")
        sys.exit(1)

    print("\n[2/2] Migrations applied successfully! ✅")
    print("\nNext step: set all environment variables in Azure App Settings.")
    print("Refer to: backend/.env.production for the full list.")

if __name__ == "__main__":
    main()
