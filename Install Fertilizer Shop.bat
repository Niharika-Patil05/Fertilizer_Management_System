@echo off
REM ============================================================
REM  Fertilizer Shop - First Time Setup
REM  Double-click this ONCE. It installs everything needed and
REM  puts a "Fertilizer Shop" icon on your Desktop for every day
REM  after that.
REM ============================================================
setlocal enabledelayedexpansion
title Fertilizer Shop - First Time Setup
cd /d "%~dp0"

echo ============================================================
echo   Setting up your Fertilizer Shop system
echo   This only runs once. Please wait - it can take a while
echo   the first time, especially if your internet is slow.
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
powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker Desktop Installer.exe' -OutFile '%~dp0DockerDesktopInstaller.exe'"
if not exist "%~dp0DockerDesktopInstaller.exe" (
  echo [FAILED] Could not download Docker Desktop. Please check your internet connection and try again.
  echo If this keeps happening, call your developer.
  pause
  exit /b 1
)

echo Installing Docker Desktop - please wait, this can take several minutes...
"%~dp0DockerDesktopInstaller.exe" install --quiet --accept-license
echo.
echo IMPORTANT: If Windows now asks you to restart the computer, please
echo let it restart, then double-click "Install Fertilizer Shop.bat" again
echo to finish - your progress so far is not lost.
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
  echo Please restart your computer if Windows asked you to, then double-click
  echo "Install Fertilizer Shop.bat" again.
  pause
  exit /b 1
)
timeout /t 5 /nobreak >nul
goto waitdockerloop

:dockerready
echo Docker is ready.
echo.
echo Downloading and starting your shop system - first time only...
call "%~dp0scripts\_start_silent.bat"
if errorlevel 1 (
  echo [FAILED] The system did not start. Call your developer and show them this window.
  pause
  exit /b 1
)

echo.
echo Creating your "Fertilizer Shop" icon on the Desktop...
cscript //nologo "%~dp0scripts\_make_shortcut.vbs"

echo.
echo ============================================================
echo   All set up!
echo ============================================================
echo.
echo Opening your Fertilizer Shop system now...
start "" "http://localhost:8080"
echo.
echo From now on, just double-click the "Fertilizer Shop" icon on
echo your Desktop every day. You will not need this window again.
echo.
pause
