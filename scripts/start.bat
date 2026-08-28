@echo off
REM ============================================================
REM  Start the Fertilizer Management System
REM  Double-click this file, or run it from a command prompt.
REM  Safe to run every time you switch the computer on.
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0.."

where docker >nul 2>nul || (echo [FAILED] Docker is not installed. Install Docker Desktop first. & pause & exit /b 1)
docker info >nul 2>nul || (echo [FAILED] Docker Desktop is not running. Start Docker Desktop, wait for it to say "running", then try again. & pause & exit /b 1)

if not exist ".env" (
  echo First run detected: creating .env from .env.example ...
  copy /y ".env.example" ".env" >nul
  for /f "usebackq delims=" %%S in (`powershell -NoProfile -Command "-join ((1..64) ^| ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })"`) do set "JWT=%%S"
  REM rewrite the line in place WITHOUT changing line endings (avoids CRLF sneaking into .env)
  powershell -NoProfile -Command "$p=(Resolve-Path '.env').Path; [IO.File]::WriteAllText($p, ([IO.File]::ReadAllText($p) -replace '(?m)^JWT_SECRET=.*', 'JWT_SECRET=%JWT%'))"
  echo .env created with a fresh security key. IMPORTANT: never delete the .env file.
)

for /f "tokens=2 delims==" %%V in ('findstr /b "APP_VERSION=" .env') do set "VER=%%V"
for /f "tokens=2 delims==" %%P in ('findstr /b "FRONTEND_PORT=" .env') do set "FPORT=%%P"
if "%FPORT%"=="" set "FPORT=8080"

echo.
echo Downloading application images (skipped automatically if offline)...
docker compose pull 2>nul

echo Starting the application...
docker compose up -d || (echo [FAILED] Containers did not start. Run scripts\logs.bat to see why. & pause & exit /b 1)

echo Waiting for the application to be ready...
set /a tries=0
:waitloop
for /f %%H in ('docker inspect -f "{{.State.Health.Status}}" fms-frontend 2^>nul') do set "H=%%H"
if "%H%"=="healthy" goto healthy
set /a tries+=1
if %tries% geq 60 (echo [FAILED] Application did not become ready in time. Run scripts\logs.bat. & pause & exit /b 1)
timeout /t 3 /nobreak >nul
goto waitloop

:healthy
echo.
echo [SUCCESS] Fertilizer Management System v%VER% is running.
echo.
echo    Open your web browser at:   http://localhost:%FPORT%
echo.
echo Leave Docker Desktop running while you use the application.
pause
