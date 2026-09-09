@echo off
cd /d "%~dp0rcc-aps"
title RCC-APS Shutdown

echo Stopping RCC-APS Payroll System...
echo.

REM ============================================================
REM Stop the Express server on port 3000
REM ============================================================
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>nul
    set FOUND=1
    echo [OK] Stopped RCC-APS server ^(port 3000^)
)
if "%FOUND%"=="0" echo [INFO] RCC-APS server was not running ^(port 3000^).

REM ============================================================
REM Stop the Vite dev server on port 5173 (if running)
REM ============================================================
set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>nul
    set FOUND=1
    echo [OK] Stopped dev server ^(port 5173^)
)
if "%FOUND%"=="0" echo [INFO] Dev server was not running ^(port 5173^).

echo.
echo RCC-APS stopped. Press any key to close.
pause >nul
