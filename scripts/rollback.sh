#!/usr/bin/env bash
# Roll the application code back to a previous version. Does NOT change the database
# unless you also restore a backup with scripts/restore.sh.
# Usage: scripts/rollback.sh 1.0.0
set -euo pipefail
cd "$(dirname "$0")/.."

PREV="${1:-}"
[ -n "$PREV" ] || { echo "Usage: scripts/rollback.sh <previous-version>"; exit 1; }
[ -f .env ] || { echo "[FAILED] .env not found."; exit 1; }

CUR=$(grep -E '^APP_VERSION=' .env | cut -d= -f2)
echo "Rolling back from ${CUR} to ${PREV}..."

sed "s|^APP_VERSION=.*|APP_VERSION=${PREV}|" .env > .env.tmp && mv .env.tmp .env
docker compose pull backend frontend 2>/dev/null || echo "(offline - using locally cached images)"
docker compose up -d

FPORT=$(grep -E '^FRONTEND_PORT=' .env | cut -d= -f2); FPORT=${FPORT:-8080}
for i in $(seq 1 30); do
  if curl -fsS "http://localhost:${FPORT}/api/health" 2>/dev/null | grep -q '"status":"OK"'; then
    echo "[SUCCESS] Rolled back to ${PREV}. Database unchanged."
    echo "If you also need to restore data from before an update: scripts/restore.sh <backup-folder>"
    exit 0
  fi
  sleep 3
done
echo "[FAILED] App did not become healthy after rollback. Check scripts/logs.sh"
exit 1
