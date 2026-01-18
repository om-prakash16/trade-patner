@echo off
:: ==========================================
:: SELF-DESTRUCT LOGIC (30 Days Expiration)
:: ==========================================
:: Expiration Date: 2026-02-18 (YYYYMMDD)
set "EXPIRATION_DATE=20260218"

:: Get Current Date using PowerShell for reliability
for /f "usebackq tokens=*" %%a in (`powershell -Command "Get-Date -Format 'yyyyMMdd'"`) do set "CURRENT_DATE=%%a"

if %CURRENT_DATE% GTR %EXPIRATION_DATE% (
    cls
    echo ==================================================
    echo  This trial script has expired.
    echo  It will now remove itself from your system.
    echo ==================================================
    timeout /t 5
    
    :: Delete this script file ("%~f0" checks its own full path)
    del "%~f0"
    exit
)

echo ==========================================
echo    Starting NGTA Trading Application...
echo ==========================================

:: 1. Start Backend Server
echo [1/3] Starting Backend Server...
start "NGTA Backend" cmd /k "cd Backend && venv\Scripts\python.exe main.py"

:: 2. Start Frontend Server
echo [2/3] Starting Frontend Server...
start "NGTA Frontend" cmd /k "cd frontend && npm run dev"

:: 3. Open Browser
echo [3/3] Opening Dashboard in 5 seconds...
timeout /t 5 >nul
start http://localhost:3000

echo.
echo ==========================================
echo    Application Started Successfully!
echo    - Backend running in separate window
echo    - Frontend running in separate window
echo    - Browser scheduled to open
echo ==========================================
pause
