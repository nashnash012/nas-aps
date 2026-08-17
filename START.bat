@echo off
cd /d "%~dp0rcc-aps"
if not exist "node_modules" (
    echo Installing dependencies... please wait
    call npm install
)
echo.
echo Starting RCC-APS Payroll System...
echo.
echo After this loads, open your browser and go to:
echo    http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.
call npm start
pause
