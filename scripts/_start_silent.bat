@echo off
REM ============================================================
REM  Internal helper - NOT meant to be double-clicked directly.
REM  Starts the containers with no interactive prompts (no
REM  "pause", no banner) so it can be called silently from
REM  "Install Fertilizer Shop.bat" and from _launch_hidden.vbs.
REM  Exit code 0 = app is up and healthy. Non-zero = something
REM  failed along the way.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0.."

where docker >nul 2>nul || exit /b 1
docker info >nul 2>nul || exit /b 1

if not exist ".env" (
  copy /y ".env.example" ".env" >nul
  for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "-join ((1..64) ^| ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })"`) do set "JWT=%%S"
  powershell -NoProfile -Command "$p=(Resolve-Path '.env').Path; [IO.File]::WriteAllText($p, ([IO.File]::ReadAllText($p) -replace '(?m)^JWT_SECRET=.*', 'JWT_SECRET=%JWT%'))"
)

docker compose pull >nul 2>nul
docker compose up -d || exit /b 1

set /a tries=0
:waitloop
for /f %%H in ('docker inspect -f "{{.State.Health.Status}}" fms-frontend 2^>nul') do set "H=%%H"
if "%H%"=="healthy" exit /b 0
set /a tries+=1
if %tries% geq 60 exit /b 1
timeout /t 3 /nobreak >nul
goto waitloop
