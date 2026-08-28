#!/usr/bin/env bash
# Restore the database from a backup folder created by backup.sh.
# Usage: scripts/restore.sh backups/fms-YYYYMMDD-HHMMSS
# This DROPS and recreates only the collections contained in the backup archive,
# then reloads their documents. Use for disaster recovery only.
set -euo pipefail
cd "$(dirname "$0")/.."

DIR="${1:-}"
[ -n "$DIR" ] || { echo "Usage: scripts/restore.sh <backup-folder>"; echo "Available:"; ls -1d backups/fms-* 2>/dev/null || echo "  (none)"; exit 1; }
ARCHIVE="${DIR%/}/dump.archive.gz"
[ -s "$ARCHIVE" ] || { echo "[FAILED] $ARCHIVE not found or empty."; exit 1; }

if ! docker compose ps --status running 2>/dev/null | grep -q fms-mongo; then
  echo "[FAILED] The database container (fms-mongo) is not running. Start the app first."
  exit 1
fi

echo "About to restore the database from: $ARCHIVE"
echo "This OVERWRITES current data in the collections contained in that backup."
read -r -p "Type RESTORE to continue: " confirm
[ "$confirm" = "RESTORE" ] || { echo "Cancelled."; exit 1; }

if docker compose exec -T mongo mongorestore --db=fertilizer_mgmt --archive --gzip --drop < "$ARCHIVE"; then
  echo "[SUCCESS] Restore complete."
else
  echo "[FAILED] Restore failed. The database may be partially restored - try again or use another backup."
  exit 1
fi
