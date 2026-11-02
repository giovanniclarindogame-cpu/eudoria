@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
 start "" "http://localhost:8000"
 py -3 -m http.server 8000
 goto :eof
)
where python >nul 2>&1
if not errorlevel 1 (
 start "" "http://localhost:8000"
 python -m http.server 8000
 goto :eof
)
echo Python 3 nao encontrado. Abra index.html no navegador ou instale Python 3.
pause
