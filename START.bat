@echo off
cd /d "%~dp0rcc-aps"
echo Starting RCC-APS Payroll System...
echo.
echo After this loads, open your browser and go to:
echo    http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.
call npm start
pause
