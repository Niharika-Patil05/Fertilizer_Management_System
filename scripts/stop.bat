@echo off
REM Stop the application. Your data stays safe in the database volume.
setlocal
cd /d "%~dp0.."
docker compose stop
echo.
echo [SUCCESS] Application stopped. All data is safe.
echo Run scripts\start.bat to start it again.
pause
