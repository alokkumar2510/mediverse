# Deployment Guide

## Frontend → Vercel
```bash
cd frontend
vercel --prod
# Domain: mediverse.alokkumarsahu.in
```

## Backend → Azure Container Apps
```bash
docker build -t ghcr.io/alok/mediverse-backend:latest ./backend
docker push ghcr.io/alok/mediverse-backend:latest
az containerapp update --name mediverse-api --resource-group mediverse-rg \
  --image ghcr.io/alok/mediverse-backend:latest
```

## Database → Supabase
```bash
cd backend
alembic upgrade head
```