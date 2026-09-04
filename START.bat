@echo off
cd /d "%~dp0rcc-aps"
title RCC-APS Payroll System

echo Starting RCC-APS Payroll System...
echo.

REM ============================================================
REM CHECK 1: Is Node.js installed?
REM ============================================================
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is NOT installed on this computer.
    echo.
    echo This system requires Node.js (JavaScript runtime) to run.
    echo.
    echo Download it for FREE from: https://nodejs.org
    echo Install it, then run this file again.
    echo.
    echo Opening the download page...
    start "" "https://nodejs.org"
    pause
    exit /b
)
echo [OK] Node.js is installed.

REM ============================================================
REM CHECK 2: Is the installed Node.js version recent enough?
REM ============================================================
for /f "tokens=1 delims=." %%v in ('node --version') do set NODE_MAJOR=%%v
set NODE_MAJOR=%NODE_MAJOR:v=%
if %NODE_MAJOR% LSS 18 (
    echo [ERROR] Your Node.js version is too old. This system requires Node.js v18 or newer.
    echo.
    echo Current version: %NODE_MAJOR%.x
    echo.
    echo Download the latest version from: https://nodejs.org
    echo Install it, then run this file again.
    echo.
    echo Opening the download page...
    start "" "https://nodejs.org"
    pause
    exit /b
)
echo [OK] Node.js %NODE_MAJOR%.x detected (satisfies requirement).

REM ============================================================
REM CHECK 3: Are the dependencies (node_modules) installed?
REM If not, download/install them automatically.
REM ============================================================
if not exist node_modules (
    echo.
    echo [NOTICE] Dependencies not found. Installing them now...
    echo (This downloads the required packages. Please wait a moment...)
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install dependencies.
        echo Please check your internet connection and try again.
        echo.
        pause
        exit /b
    )
    echo.
    echo [OK] Dependencies installed successfully.
) else (
    echo [OK] Dependencies found.
)

echo.
echo After this loads, open your browser and go to:
echo    http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.
call npm start
pause
