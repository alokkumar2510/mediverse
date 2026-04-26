"""Validate all required environment variables are set."""
import os, sys
from dotenv import load_dotenv
load_dotenv()

REQUIRED = [
    "APP_NAME","ENV","DATABASE_URL",
    "JWT_SECRET","REDIS_URL","FRONTEND_URL","API_URL"
]
missing = [k for k in REQUIRED if not os.getenv(k)]
if missing:
    print(f"MISSING: {', '.join(missing)}")
    sys.exit(1)
print("All required env vars present.")