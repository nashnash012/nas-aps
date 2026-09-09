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
    echo This system requires Node.js ^(JavaScript runtime^) to run.
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
REM CHECK 3: Is MySQL/MariaDB reachable on localhost:3306?
REM The system now stores data in the "rcc_aps" MySQL database.
REM Tries the XAMPP bundled client first (common on demo machines),
REM then falls back to a PATH-installed mysql client.
REM ============================================================
set MYSQL_OK=0
set "MYSQL_CLI=mysql"
if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_CLI=C:\xampp\mysql\bin\mysql.exe"
if exist "D:\xampp\mysql\bin\mysql.exe" set "MYSQL_CLI=D:\xampp\mysql\bin\mysql.exe"
"%MYSQL_CLI%" -u root -e "SELECT 1" >nul 2>nul
if not errorlevel 1 set MYSQL_OK=1
if "%MYSQL_OK%"=="0" (
    echo.
    echo [ERROR] MySQL/MariaDB is NOT reachable on localhost:3306.
    echo.
    echo This system REQUIRES MySQL. Login and all data are stored in the
    echo "rcc_aps" database, so the system cannot run without it.
    echo.
    echo Please start MySQL first ^(e.g. XAMPP Control Panel -^> Start MySQL^),
    echo then run this file again.
    echo.
    pause
    exit /b
) else (
    echo [OK] MySQL is reachable ^(localhost:3306^). Data will persist to the "rcc_aps" database.
)

REM ============================================================
REM CHECK 4: Are the dependencies (node_modules) installed?
REM If not, download/install them automatically.
REM ============================================================
if not exist node_modules (
    echo.
    echo [NOTICE] Dependencies not found. Installing them now...
    echo ^(This downloads the required packages. Please wait a moment...^)
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

REM ============================================================
REM CHECK 5: Is the React UI (client/dist) built and up to date?
REM This system serves the React app from client/dist at :3000.
REM It only rebuilds when needed (missing dist, or source files
REM newer than the current build).
REM ============================================================
if not exist "client\node_modules" (
    echo.
    echo [NOTICE] React dependencies not found. Installing them now...
    echo ^(This downloads the required packages. Please wait a moment...^)
    echo.
    call npm --prefix client install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install React dependencies.
        echo Please check your internet connection and try again.
        echo.
        pause
        exit /b
    )
    if not exist "client\node_modules" (
        echo.
        echo [ERROR] React dependencies were not installed successfully.
        echo Please check your internet connection and try again.
        echo.
        pause
        exit /b
    )
    echo.
    echo [OK] React dependencies installed.
)

set NEED_BUILD=0
if not exist "client\dist\index.html" set NEED_BUILD=1
for /f "delims=" %%F in ('dir /s /b /a-d "client\src\*.*" 2^>nul') do (
    for %%B in ("client\dist\index.html") do if "%%~tF" GTR "%%~tB" set NEED_BUILD=1
)
if "%NEED_BUILD%"=="1" (
    echo.
    echo [NOTICE] React UI needs a build ^(client/dist is missing or outdated^).
    echo Building now ^(this takes a few seconds^)...
    echo.
    call npm --prefix client run build
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to build the React UI.
        echo.
        pause
        exit /b
    )
    if not exist "client\dist\index.html" (
        echo.
        echo [ERROR] The React UI build did not complete successfully.
        echo.
        pause
        exit /b
    )
    echo.
    echo [OK] React UI built successfully.
) else (
    echo [OK] React UI build is up to date ^(client/dist^).
)
echo [OK] React UI ready - served at http://localhost:3000

echo.
echo After this loads, open your browser and go to:
echo    http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.
call npm start
pause
