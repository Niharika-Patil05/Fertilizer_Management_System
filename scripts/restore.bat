@echo off
REM ============================================================
REM  Restore the database from a backup folder made by backup.bat
REM  Usage:  scripts\restore.bat backups\fms-YYYYMMDD-HHMMSS
REM  For disaster recovery only. This OVERWRITES current data
REM  in the collections contained in the backup.
REM ============================================================
setlocal
cd /d "%~dp0.."

set "DIR=%~1"
if "%DIR%"=="" (
  echo Usage: scripts\restore.bat ^<backup-folder^>
  echo Available backups:
  dir /b /ad backups\fms-* 2>nul
  pause & exit /b 1
)
set "ARCHIVE=%DIR%\dump.archive.gz"
if not exist "%ARCHIVE%" (echo [FAILED] %ARCHIVE% not found. & pause & exit /b 1)

docker compose ps --status running 2>nul | findstr /c:"fms-mongo" >nul || (echo [FAILED] The database is not running. Run scripts\start.bat first. & pause & exit /b 1)

echo.
echo This will OVERWRITE current data using: %ARCHIVE%
set /p CONFIRM="Type RESTORE and press Enter to continue: "
if /i not "%CONFIRM%"=="RESTORE" (echo Cancelled. & pause & exit /b 1)

docker compose exec -T mongo mongorestore --db=fertilizer_mgmt --archive --gzip --drop < "%ARCHIVE%"
if errorlevel 1 (echo [FAILED] Restore failed. Try another backup. & pause & exit /b 1)

echo.
echo [SUCCESS] Database restored from %DIR%
pause
