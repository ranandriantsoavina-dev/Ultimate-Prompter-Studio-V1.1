@echo off
setlocal EnableExtensions
title Ultimate Prompter - Start Everything
color 0B

REM Always start from this BAT file's folder (project root).
cd /d "%~dp0"

echo ============================================================
echo       ULTIMATE PROMPTER - ONE-CLICK STARTUP
echo ============================================================
echo.

REM Verify project root.
if not exist "package.json" (
  echo [ERROR] package.json not found in:
  echo         %CD%
  echo.
  echo Put this BAT file in the project root beside package.json.
  pause
  exit /b 1
)

REM Verify Node.js and npm.
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found in PATH. Install Node.js first.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found in PATH. Repair/reinstall Node.js.
  pause
  exit /b 1
)

echo.
echo [1/3] Installing/checking npm dependencies...
if not exist "node_modules" (
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
) else (
  echo node_modules already exists; skipping npm install.
)

echo.
echo [2/3] Starting Backend API and Photo File Server on http://localhost:3000 ...
start "Ultimate Prompter - Backend Server (Port 3000)" /D "%CD%" cmd /k "call npm run server"
if errorlevel 1 (
  echo [ERROR] Could not start backend server.
  pause
  exit /b 1
)

echo.
echo Waiting 3 seconds for backend server to bind to port 3000...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting Vite Frontend App on http://localhost:5173 ...
start "Ultimate Prompter - Vite App (Port 5173)" /D "%CD%" cmd /k "call npm run dev"
if errorlevel 1 (
  echo [ERROR] Could not start Vite development app.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  Both Backend (Port 3000) and Frontend (Port 5173) started!
echo  Your local photos and database are live at /files and /api.
echo ============================================================