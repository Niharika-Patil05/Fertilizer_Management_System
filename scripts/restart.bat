@echo off
REM Restart the application without touching data.
setlocal
cd /d "%~dp0.."
docker compose restart
echo.
echo [SUCCESS] Application restarted.
pause
