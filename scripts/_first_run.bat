@echo off
REM ============================================================
REM  Runs once, automatically, at the end of the Setup.exe wizard
REM  (see installer\FertilizerShop.iss [Run] section). Installs
REM  Docker if needed, then starts the app for the first time.
REM  The Desktop/Start Menu shortcuts are created by the installer
REM  itself - this script only gets the app running.
REM ============================================================
setlocal enabledelayedexpansion
title Fertilizer Shop - Finishing Setup
cd /d "%~dp0.."

echo ============================================================
echo   Finishing setup
echo   This can take a while the first time, especially if your
echo   internet is slow. Please don't close this window.
echo ============================================================
echo.

docker info >nul 2>nul
if %errorlevel%==0 goto dockerready

where docker >nul 2>nul
if %errorlevel%==0 (
  echo Starting Docker...
  start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  goto waitdocker
)

echo This system needs one extra free program called "Docker Desktop".
echo Downloading it now...
echo.
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker Desktop Installer.exe' -OutFile '%TEMP%\DockerDesktopInstaller.exe'"
if not exist "%TEMP%\DockerDesktopInstaller.exe" (
  echo [FAILED] Could not download Docker Desktop. Please check your internet connection,
  echo then run "Fertilizer Shop" from the Start Menu again.
  echo If this keeps happening, call your developer.
  pause
  exit /b 1
)

echo Installing Docker Desktop - please wait, this can take several minutes...
"%TEMP%\DockerDesktopInstaller.exe" install --quiet --accept-license
del "%TEMP%\DockerDesktopInstaller.exe" >nul 2>nul
echo.
echo IMPORTANT: If Windows now asks you to restart the computer, please let
echo it restart, then open "Fertilizer Shop" from the Desktop or Start Menu
echo again to finish - your progress so far is not lost.
echo.
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

:waitdocker
echo Waiting for Docker to be ready - this can take a minute or two...
set /a tries=0
:waitdockerloop
docker info >nul 2>nul
if %errorlevel%==0 goto dockerready
set /a tries+=1
if %tries% geq 60 (
  echo.
  echo Docker is still starting, or your computer needs to restart first.
  echo Please restart your computer if Windows asked you to, then open
  echo "Fertilizer Shop" from the Desktop or Start Menu again.
  pause
  exit /b 1
)
timeout /t 5 /nobreak >nul
goto waitdockerloop

:dockerready
echo Docker is ready.
echo.
echo Downloading and starting your shop system - first time only...
call "%~dp0_start_silent.bat"
if errorlevel 1 (
  echo [FAILED] The system did not start. Call your developer and show them this window.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   All set up!
echo ============================================================
echo.
echo Opening your Fertilizer Shop system now...
start "" "http://localhost:8080"
echo.
echo From now on, just open "Fertilizer Shop" from your Desktop or
echo Start Menu. It will keep itself up to date automatically.
echo.
pause
