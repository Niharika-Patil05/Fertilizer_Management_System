@echo off
REM View application logs. Close this window or press Ctrl+C to stop viewing.
REM (This does NOT stop the application.)
setlocal
cd /d "%~dp0.."
docker compose logs -f --tail=200
