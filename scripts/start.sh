#!/usr/bin/env bash
# Start the Fertilizer Management System. Safe to run repeatedly.
# (Linux/macOS twin of start.bat - used for development and testing.)
set -euo pipefail
cd "$(dirname "$0")/.."

command -v docker >/dev/null 2>&1 || { echo "[FAILED] Docker is not installed."; exit 1; }
docker info >/dev/null 2>&1 || { echo "[FAILED] Docker is not running."; exit 1; }

if [ ! -f .env ]; then
  echo "First run: creating .env from .env.example ..."
  cp .env.example .env
  SECRET=$(head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n')
  # portable in-place edit
  sed "s|^JWT_SECRET=.*|JWT_SECRET=${SECRET}|" .env > .env.tmp && mv .env.tmp .env
  echo ".env created with a fresh JWT secret. DO NOT delete this file."
fi

echo "Pulling application images (ignored if offline)..."
docker compose pull 2>/dev/null || echo "(offline - using local images)"

echo "Starting containers..."
docker compose up -d

FPORT=$(grep -E '^FRONTEND_PORT=' .env | cut -d= -f2); FPORT=${FPORT:-8080}
VER=$(grep -E '^APP_VERSION=' .env | cut -d= -f2); VER=${VER:-unknown}

echo "Waiting for the application to become healthy..."
for i in $(seq 1 60); do
  status=$(docker inspect -f '{{.State.Health.Status}}' fms-frontend 2>/dev/null || echo starting)
  [ "$status" = "healthy" ] && { echo "[SUCCESS] Fertilizer Management System v${VER} is running."; echo "Open: http://localhost:${FPORT}"; exit 0; }
  sleep 3
done
echo "[FAILED] Application did not become healthy in time. Check: scripts/logs.sh"
exit 1
