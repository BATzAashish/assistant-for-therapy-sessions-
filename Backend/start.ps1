# TherapyHub Backend Start Script (PowerShell)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   TherapyHub Backend - Flask API    " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host "Virtual environment not found. Creating..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✓ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "WARNING: .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created. Please update it with your settings." -ForegroundColor Green
    Write-Host ""
}

# Install/Update dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
pip install -q -r requirements.txt
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Check MongoDB connection
Write-Host ""
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow

$mongoCheck = python -c "from pymongo import MongoClient; import sys; import os; from dotenv import load_dotenv; load_dotenv(); uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/therapy_assistant'); client = MongoClient(uri); client.admin.command('ping'); print('connected')" 2>&1

if ($mongoCheck -like "*connected*") {
    Write-Host "✓ MongoDB connection successful" -ForegroundColor Green
} else {
    Write-Host "✗ MongoDB connection failed" -ForegroundColor Red
    Write-Host "Please ensure MongoDB is running or check your MONGO_URI in .env" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Do you want to continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Starting Flask server..." -ForegroundColor Green
Write-Host "API available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Health check: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start Flask app
python app.py
