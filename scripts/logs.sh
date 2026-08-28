#!/usr/bin/env bash
# Follow application logs. Press Ctrl+C to stop viewing (does not stop the app).
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose logs -f --tail=200
