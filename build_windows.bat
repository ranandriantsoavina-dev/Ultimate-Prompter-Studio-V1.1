@echo off
TITLE Building Ultimate Prompter Studio for Windows (.exe)
COLOR 0A
echo ==========================================
echo Ultimate Prompter Studio - Windows .exe Builder
echo ==========================================
echo.
echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Building React application...
call npm run build
if %errorlevel% neq 0 (
    echo Error building React app!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Packaging Windows .exe using electron-builder...
call npm run electron:build
if %errorlevel% neq 0 (
    echo Error packaging .exe!
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo SUCCESS! Your Windows .exe has been created.
echo Check the 'release' folder for the installer and portable .exe!
echo ==========================================
pause
