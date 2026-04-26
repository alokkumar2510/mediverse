# MediVerse AI — Architecture Overview

See: [MediVerse_Architecture_Blueprint.md](../MediVerse_Architecture_Blueprint.md)

## System Diagram
```
User -> Cloudflare -> Vercel (Next.js)
                   -> Azure Container Apps (FastAPI)
                         -> Supabase PostgreSQL
                         -> Redis (Upstash)
                         -> ML inference (in-process ONNX/XGBoost)
```

## URLs
| Service   | URL                                      |
|-----------|------------------------------------------|
| Frontend  | https://mediverse.alokkumarsahu.in       |
| API       | https://api.mediverse.alokkumarsahu.in   |
| API Docs  | https://api.mediverse.alokkumarsahu.in/api/docs |