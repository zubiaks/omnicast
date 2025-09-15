@echo off
cd /d "%~dp0"

REM sobe o Vite em dev e abre o browser uma vez
start "OmniCast Dev" cmd /k "npm run dev"

exit
