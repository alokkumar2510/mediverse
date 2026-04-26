#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# MediVerse AI — Rollback Script
# Usage:
#   ./scripts/rollback.sh backend  <git-sha>   # Roll back backend to specific image
#   ./scripts/rollback.sh frontend <git-sha>   # Roll back CF Pages deployment
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

TARGET="${1:-}"
SHA="${2:-}"

if [[ -z "$TARGET" || -z "$SHA" ]]; then
  echo "Usage: $0 <backend|frontend> <git-sha>"
  exit 1
fi

case "$TARGET" in
  backend)
    echo "🔵 Rolling back backend to image: $SHA"
    # Re-deploy the specific Docker image tag to Azure
    # Requires az CLI authenticated
    az webapp config container set \
      --name mediverse-api \
      --resource-group mediverse-rg \
      --docker-custom-image-name "ghcr.io/$(gh api user --jq .login)/mediverse-backend:${SHA}"
    echo "✅ Backend rolled back"
    ;;

  frontend)
    echo "☁️  Rolling back frontend to commit: $SHA"
    # List CF Pages deployments and re-deploy the old one
    # Requires wrangler installed and authenticated
    wrangler pages deployment list --project-name=mediverse | head -20
    echo ""
    echo "ℹ️  Find the deployment ID for commit $SHA above, then run:"
    echo "    wrangler pages deployment create --project-name=mediverse --deployment-id=<ID>"
    echo ""
    echo "Or alias + promote via Cloudflare dashboard → Pages → Deployments → ..."
    ;;

  *)
    echo "Unknown target: $TARGET (use 'backend' or 'frontend')"
    exit 1
    ;;
esac
