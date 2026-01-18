@echo off
echo ==========================================
echo      NGTA First-Time Setup Script
echo ==========================================
echo This script sets up the environment for your PC.
echo Requirements: Python 3.10+ and Node.js must be installed.
echo.

:: 1. Setup Backend
echo [1/2] Setting up Backend (Python)...
cd Backend
if exist venv (
    echo Removing old virtual environment...
    rmdir /s /q venv
)
echo Creating new virtual environment...
python -m venv venv
if errorlevel 1 (
    echo Error: Python not found! Please install Python 3.10+ and add to PATH.
    pause
    exit /b
)

echo Activate venv and install dependencies...
call venv\Scripts\activate
pip install -r requirements.txt
if errorlevel 1 (
    echo Error installing python requirements.
    pause
    exit /b
)
cd ..

:: 2. Setup Frontend
echo.
echo [2/2] Setting up Frontend (Node.js)...
cd frontend
echo Installing node modules...
call npm install
if errorlevel 1 (
    echo Error: npm not found! Please install Node.js.
    pause
    exit /b
)
cd ..

echo.
echo ==========================================
echo       Setup Complete! verify No Errors.
echo ==========================================
echo You can now run the application using 'run_app.bat'
echo.
pause
