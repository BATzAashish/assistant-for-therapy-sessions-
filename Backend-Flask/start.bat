@echo off
echo ======================================
echo    TherapyHub Backend - Flask API
echo ======================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Creating...
    python -m venv venv
    echo Virtual environment created
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check if .env exists
if not exist ".env" (
    echo.
    echo WARNING: .env file not found!
    echo Creating .env from .env.example...
    copy .env.example .env
    echo .env file created. Please update it with your settings.
    echo.
)

REM Install dependencies
echo Checking dependencies...
pip install -q -r requirements.txt
echo Dependencies installed

echo.
echo ======================================
echo Starting Flask server...
echo API available at: http://localhost:5000
echo Health check: http://localhost:5000/api/health
echo ======================================
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start Flask app
python app.py
