@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Opening GMI at http://localhost:8765
where py >nul 2>nul
if %errorlevel%==0 (py -3 server.py 8765) else (python server.py 8765)
pause
