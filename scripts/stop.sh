#!/usr/bin/env bash
# Stop the application. Containers stop; the database volume and all data are untouched.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose stop
echo "[SUCCESS] Application stopped. Your data is safe. Run scripts/start.sh to start again."
