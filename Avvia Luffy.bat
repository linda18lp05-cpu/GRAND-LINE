@echo off
cd /d "%~dp0luffy-overlay"
if exist stop.ps1 powershell -NoProfile -ExecutionPolicy Bypass -File "%CD%\stop.ps1"
timeout /t 1 /nobreak >nul
where npm >nul 2>nul
if errorlevel 1 (
  echo Serve Node.js: https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules call npm install
call npm start
