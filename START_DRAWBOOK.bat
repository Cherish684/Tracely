@echo off
echo ========================================
echo   Tracely...
echo ========================================
cd /d "%~dp0"
start "" "http://localhost:5050"
timeout /t 2 /nobreak > nul
python app.py
pause