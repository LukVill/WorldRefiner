@echo off
REM start-electron.bat
REM Change to this script's directory (repo root) and run the npm script that starts Electron.
cd /d "%~dp0"
echo Starting Electron (running: npm run start:electron)...
call npm run start:electron
pause
