@echo off
REM ============================================================
REM  Roll the application back to a previous version.
REM  This does NOT change the database. If you also need the
REM  old data back, run scripts\restore.bat afterwards.
REM  Usage:  scripts\rollback.bat 1.0.0
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0.."

set "PREV=%~1"
if "%PREV%"=="" (echo Usage: scripts\rollback.bat ^<previous-version^> & pause & exit /b 1)
if not exist ".env" (echo [FAILED] .env not found. & pause & exit /b 1)

for /f "tokens=2 delims==" %%V in ('findstr /b "APP_VERSION=" .env') do set "CUR=%%V"
for /f "tokens=2 delims==" %%P in ('findstr /b "FRONTEND_PORT=" .env') do set "FPORT=%%P"
if "%FPORT%"=="" set "FPORT=8080"

echo Rolling back from %CUR% to %PREV% ...
powershell -NoProfile -Command "$p=(Resolve-Path '.env').Path; [IO.File]::WriteAllText($p, ([IO.File]::ReadAllText($p) -replace '(?m)^APP_VERSION=.*', 'APP_VERSION=%PREV%'))"
docker compose pull backend frontend 2>nul
docker compose up -d

powershell -NoProfile -Command ^
  "$ok=$false; for($i=0;$i -lt 30;$i++){ try { $h=Invoke-RestMethod -UseBasicParsing ('http://localhost:%FPORT%/api/health'); if($h.status -eq 'OK'){ $ok=$true; break } } catch {}; Start-Sleep 3 }; if(-not $ok){ exit 1 }"
if errorlevel 1 (echo [FAILED] App did not become healthy after rollback. Run scripts\logs.bat. & pause & exit /b 1)

echo.
echo [SUCCESS] Rolled back to %PREV%. Database unchanged.
pause
