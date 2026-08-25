@echo off
chcp 65001 > nul
echo =============================================================
echo 🚀 AI Learning Module - Launcher (Windows)
echo =============================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js 20 or newer is required. Please install it from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Installing local reader dependencies...
    call npm install --no-audit --no-fund
)

if exist "server.js" (
    echo [INFO] Starting reader server at http://127.0.0.1:4173 ...
    start http://127.0.0.1:4173
    node server.js
) else (
    echo [ERROR] server.js not found.
    pause
)

