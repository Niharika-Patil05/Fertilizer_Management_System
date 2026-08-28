#!/usr/bin/env bash
# Create a timestamped, compressed backup of the MongoDB database + the .env file.
# The live database is only READ, never modified. Backups are written to ./backups
# on the host (outside every container), and are git-ignored.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v docker >/dev/null 2>&1 || { echo "[FAILED] Docker is not installed."; exit 1; }

if ! docker compose ps --status running 2>/dev/null | grep -q fms-mongo; then
  echo "[FAILED] The database container (fms-mongo) is not running. Start the app first."
  exit 1
fi

TS=$(date +%Y%m%d-%H%M%S)
DIR="backups/fms-${TS}"
mkdir -p "$DIR"

echo "Backing up database to ${DIR}/dump.archive.gz ..."
if ! docker compose exec -T mongo mongodump --db=fertilizer_mgmt --archive --gzip > "${DIR}/dump.archive.gz"; then
  echo "[FAILED] mongodump failed. Backup NOT created."
  rm -rf "$DIR"
  exit 1
fi

if [ ! -s "${DIR}/dump.archive.gz" ]; then
  echo "[FAILED] Backup file is empty. Backup NOT created."
  rm -rf "$DIR"
  exit 1
fi

[ -f .env ] && cp .env "${DIR}/env.backup"

VER=$(grep -E '^APP_VERSION=' .env 2>/dev/null | cut -d= -f2 || echo unknown)
{
  echo "created:      ${TS}"
  echo "app_version:  ${VER}"
  echo "size_bytes:   $(wc -c < "${DIR}/dump.archive.gz")"
} > "${DIR}/meta.txt"

echo "[SUCCESS] Backup created: ${DIR}"
echo "  - dump.archive.gz  (database)"
echo "  - env.backup       (configuration/secrets)"
