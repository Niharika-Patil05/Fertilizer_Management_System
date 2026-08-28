#!/usr/bin/env bash
# Safe application update. Data is backed up first and the MongoDB volume is never touched.
# Usage:
#   scripts/update.sh                # update to the version published in release.json on GitHub
#   scripts/update.sh 1.2.0          # update to a specific version
set -euo pipefail
cd "$(dirname "$0")/.."

REPO_RAW="https://raw.githubusercontent.com/Niharika-Patil05/Fertilizer_Management_System/main/release.json"

command -v docker >/dev/null 2>&1 || { echo "[FAILED] Docker is not installed."; exit 1; }
docker info >/dev/null 2>&1 || { echo "[FAILED] Docker is not running."; exit 1; }
[ -f .env ] || { echo "[FAILED] .env not found. Run scripts/start.sh once first."; exit 1; }

OLD=$(grep -E '^APP_VERSION=' .env | cut -d= -f2)
echo "Current installed version: ${OLD}"

NEW="${1:-}"
if [ -z "$NEW" ]; then
  echo "Checking for the latest published version..."
  NEW=$(curl -fsSL "$REPO_RAW" 2>/dev/null | grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || true)
  [ -n "$NEW" ] || { echo "[FAILED] Could not reach GitHub to check the latest version. Connect to the internet, or pass a version: scripts/update.sh <version>"; exit 1; }
fi
echo "Target version: ${NEW}"

if [ "$NEW" = "$OLD" ]; then
  echo "[SUCCESS] Already running version ${OLD}. Nothing to do."
  exit 0
fi

echo "=== Step 1/5: Backup ==="
BACKUP_OUT=$(bash scripts/backup.sh) || { echo "[FAILED] Backup failed - update aborted. No changes made."; exit 1; }
echo "$BACKUP_OUT"
BACKUP_DIR=$(echo "$BACKUP_OUT" | grep -o 'backups/fms-[0-9-]*' | head -n1)

revert() {
  echo "Rolling back application to ${OLD}..."
  sed "s|^APP_VERSION=.*|APP_VERSION=${OLD}|" .env > .env.tmp && mv .env.tmp .env
  docker compose up -d || true
  echo "[FAILED] Update to ${NEW} failed. Rolled back to ${OLD}."
  echo "         Your data was NOT changed. Pre-update backup kept at: ${BACKUP_DIR:-backups/}"
  exit 1
}

echo "=== Step 2/5: Download new version images (${NEW}) ==="
sed "s|^APP_VERSION=.*|APP_VERSION=${NEW}|" .env > .env.tmp && mv .env.tmp .env
docker compose pull backend frontend || revert

echo "=== Step 3/5: Apply & start (migrations run automatically inside the backend) ==="
docker compose up -d || revert

echo "=== Step 4/5: Health check ==="
FPORT=$(grep -E '^FRONTEND_PORT=' .env | cut -d= -f2); FPORT=${FPORT:-8080}
OK=""
for i in $(seq 1 30); do
  BODY=$(curl -fsS "http://localhost:${FPORT}/api/health" 2>/dev/null || true)
  if echo "$BODY" | grep -q '"status":"OK"' && echo "$BODY" | grep -q "\"version\":\"${NEW}\""; then OK=1; break; fi
  sleep 3
done
[ -n "$OK" ] || revert

echo "=== Step 5/5: Done ==="
echo "[SUCCESS] Updated ${OLD} -> ${NEW}. All data preserved. Backup at: ${BACKUP_DIR:-backups/}"
