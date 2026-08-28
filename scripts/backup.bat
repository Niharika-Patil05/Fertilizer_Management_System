@echo off
REM ============================================================
REM  Create a timestamped backup of the database + configuration.
REM  The live database is only READ, never changed.
REM  Backups are saved in the "backups" folder next to this project.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0.."

docker compose ps --status running 2>nul | findstr /c:"fms-mongo" >nul || (echo [FAILED] The database is not running. Run scripts\start.bat first. & pause & exit /b 1)

for /f "usebackq delims=" %%T in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"`) do set "TS=%%T"
if not defined TS (echo [FAILED] Could not generate a timestamp (PowerShell unavailable?). Backup NOT created. & pause & exit /b 1)
set "DIR=backups\fms-%TS%"
mkdir "%DIR%" 2>nul

echo Backing up database to %DIR%\dump.archive.gz ...
docker compose exec -T mongo mongodump --db=fertilizer_mgmt --archive --gzip > "%DIR%\dump.archive.gz"
if errorlevel 1 (echo [FAILED] Database export failed. Backup NOT created. & rmdir /s /q "%DIR%" & pause & exit /b 1)

for %%A in ("%DIR%\dump.archive.gz") do set "SZ=%%~zA"
if not defined SZ set "SZ=0"
if %SZ% LEQ 0 (echo [FAILED] Backup file is empty. Backup NOT created. & rmdir /s /q "%DIR%" & pause & exit /b 1)

if exist ".env" copy /y ".env" "%DIR%\env.backup" >nul

for /f "tokens=2 delims==" %%V in ('findstr /b "APP_VERSION=" .env') do set "VER=%%V"
> "%DIR%\meta.txt" echo created:     %TS%
>>"%DIR%\meta.txt" echo app_version: %VER%
>>"%DIR%\meta.txt" echo size_bytes:  %SZ%

echo.
echo [SUCCESS] Backup created: %DIR%
echo     dump.archive.gz  = database
echo     env.backup       = configuration / security key
if "%~1"=="" pause
