@echo off
cd /d "%~dp0backend"
if exist venv\Scripts\activate (
    call venv\Scripts\activate
) else (
    echo Virtual environment not found. Please run setup first.
    pause
    exit /b
)
echo Starting Backend Server...
uvicorn main:app --reload
pause
