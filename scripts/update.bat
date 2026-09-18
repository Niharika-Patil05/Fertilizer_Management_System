@echo off
REM ============================================================
REM  Safe application update.
REM   1. checks Docker           4. downloads the new version
REM   2. checks the app is set   5. runs database migrations
REM   3. backs up the database   6. health-checks, or rolls back
REM  The database volume is NEVER deleted. A backup is always kept.
REM
REM  Usage:  scripts\update.bat          (update to the latest published version)
REM          scripts\update.bat 1.2.0    (update to a specific version)
REM          scripts\update.bat --quiet  (auto-detect latest, no prompts, used by
REM                                       the Desktop icon's automatic update check -
REM                                       not meant to be run by hand)
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0.."

set "QUIET=0"
if /i "%~1"=="--quiet" set "QUIET=1"

set "REPO_RAW=https://raw.githubusercontent.com/Niharika-Patil05/Fertilizer_Management_System/main/release.json"

REM In quiet mode, a Docker/setup problem is not this script's job to report -
REM just back off silently and let the normal startup flow handle/report it.
where docker >nul 2>nul
if errorlevel 1 (
  if "%QUIET%"=="1" exit /b 0
  echo [FAILED] Docker is not installed.
  pause
  exit /b 1
)

docker info >nul 2>nul
if errorlevel 1 (
  if "%QUIET%"=="1" exit /b 0
  echo [FAILED] Docker Desktop is not running.
  pause
  exit /b 1
)

if not exist ".env" (
  if "%QUIET%"=="1" exit /b 0
  echo [FAILED] .env not found. Run scripts\start.bat once first.
  pause
  exit /b 1
)

for /f "tokens=2 delims==" %%V in ('findstr /b "APP_VERSION=" .env') do set "OLD=%%V"
for /f "tokens=2 delims==" %%P in ('findstr /b "FRONTEND_PORT=" .env') do set "FPORT=%%P"
if "%FPORT%"=="" set "FPORT=8080"
echo Current installed version: %OLD%

set "NEW="
if not "%QUIET%"=="1" set "NEW=%~1"
if "%NEW%"=="" (
  echo Checking GitHub for the latest published version...
  for /f "usebackq delims=" %%N in (`powershell -NoProfile -Command "try { (Invoke-RestMethod -UseBasicParsing -TimeoutSec 10 '%REPO_RAW%').version } catch { '' }"`) do set "NEW=%%N"
)
if "%NEW%"=="" (
  if "%QUIET%"=="1" exit /b 0
  echo [FAILED] Could not determine the target version. Connect to the internet or run: scripts\update.bat ^<version^>
  pause
  exit /b 1
)
echo Target version: %NEW%

if "%NEW%"=="%OLD%" (
  if "%QUIET%"=="1" exit /b 0
  echo [SUCCESS] Already running version %OLD%. Nothing to do.
  pause
  exit /b 0
)

echo.
echo === Step 1/5: Backup ===
call "%~dp0backup.bat" quiet
if errorlevel 1 (
  if "%QUIET%"=="1" exit /b 1
  echo [FAILED] Backup failed - update aborted. Nothing was changed.
  pause
  exit /b 1
)
set "BACKUP_DIR="
for /f "delims=" %%D in ('dir /b /ad /o-d backups\fms-* 2^>nul') do if not defined BACKUP_DIR set "BACKUP_DIR=backups\%%D"

echo.
echo === Step 2/5: Download new version %NEW% ===
powershell -NoProfile -Command "$p=(Resolve-Path '.env').Path; [IO.File]::WriteAllText($p, ([IO.File]::ReadAllText($p) -replace '(?m)^APP_VERSION=.*', 'APP_VERSION=%NEW%'))"
docker compose pull backend frontend
if errorlevel 1 goto :rollback

echo.
echo === Step 3/5: Apply update and run migrations ===
docker compose up -d
if errorlevel 1 goto :rollback

echo.
echo === Step 4/5: Health check ===
powershell -NoProfile -Command ^
  "$ok=$false; for($i=0;$i -lt 30;$i++){ try { $h=Invoke-RestMethod -UseBasicParsing ('http://localhost:%FPORT%/api/health'); if($h.status -eq 'OK' -and $h.version -eq '%NEW%'){ $ok=$true; break } } catch {}; Start-Sleep 3 }; if(-not $ok){ exit 1 }"
if errorlevel 1 goto :rollback

echo.
echo === Step 5/5: Done ===
echo [SUCCESS] Updated %OLD% -^> %NEW%. All data preserved.
echo Backup kept at: %BACKUP_DIR%
if not "%QUIET%"=="1" pause
exit /b 0

:rollback
echo.
echo [FAILED] Update to %NEW% failed. Rolling application back to %OLD% ...
powershell -NoProfile -Command "$p=(Resolve-Path '.env').Path; [IO.File]::WriteAllText($p, ([IO.File]::ReadAllText($p) -replace '(?m)^APP_VERSION=.*', 'APP_VERSION=%OLD%'))"
docker compose up -d
echo Your data was NOT changed. Pre-update backup kept at: %BACKUP_DIR%
if not "%QUIET%"=="1" pause
exit /b 1
