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

if not exist "server\Cargo.toml" (
  echo [ERROR] server\Cargo.toml not found.
  echo The README requires the Rust server in the server\ folder.
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

REM Verify Cargo.
where cargo >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Rust Cargo was not found in PATH. Install Rust via rustup.rs.
  pause
  exit /b 1
)

echo [1/4] Loading MSVC build environment...
where link.exe >nul 2>nul
if errorlevel 1 (
  REM Check standard installation path for VS 2026 Build Tools first
  if exist "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\Tools\VsDevCmd.bat" (
    call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64 >nul
  ) else (
    REM Fallback to vswhere search
    set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
    if exist "%VSWHERE%" (
      for /f "usebackq delims=" %%I in (`"%VSWHERE%" -all -products * -property installationPath`) do set "VSINSTALL=%%I"
    )
    if defined VSINSTALL if exist "%VSINSTALL%\Common7\Tools\VsDevCmd.bat" (
      call "%VSINSTALL%\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64 >nul
    )
  )
)
echo Environment loaded. Proceeding...

echo.
echo [2/4] Installing/checking npm dependencies...
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
echo [3/4] Starting Rust API and file server...
echo This may take several minutes the first time while Cargo compiles.
start "Ultimate Prompter - Rust Server" /D "%CD%\server" cmd /k "call cargo run --release"
if errorlevel 1 (
  echo [ERROR] Could not open the Rust server terminal.
  pause
  exit /b 1
)

echo.
echo Waiting 5 seconds for the Rust server to begin starting...
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Starting Vite development app...
start "Ultimate Prompter - Vite App" /D "%CD%" cmd /k "call npm run dev"
if errorlevel 1 (