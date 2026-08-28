#!/usr/bin/env bash
# Restart the application without touching data.
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose restart
echo "[SUCCESS] Application restarted."
