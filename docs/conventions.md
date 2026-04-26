# Coding Conventions

## Naming Rules
| Context | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase.tsx | XrayUploader.tsx |
| Next.js pages | lowercase/page.tsx | xray/page.tsx |
| Hooks | useCamelCase.ts | useAuth.ts |
| Stores | camelCaseStore.ts | authStore.ts |
| Python services | snake_case_service.py | xray_service.py |
| Python classes | PascalCase | XrayModel |
| DB tables | snake_case plural | usage_logs |
| API routes | kebab-case | /api/auth/forgot-password |
| Env vars | SCREAMING_SNAKE_CASE | JWT_SECRET |

## Architecture Rules
1. Thin routers, fat services
2. One file = one concern
3. ML models are singletons (load once at startup)
4. No raw SQL — SQLAlchemy ORM only
5. Zero hardcoded secrets — env-driven config only
6. All FastAPI routes must be async def
7. Full type hints everywhere