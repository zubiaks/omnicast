@echo off
title Omnicast - Servidor e Navegador Portátil

REM Ir para a pasta onde está o .bat (public)
cd /d "%~dp0"

REM Caminhos principais
set "PYTHON_PORTABLE=..\python-embed\python.exe"
set "BRAVE_PORTABLE=%~dp0brave-portable\brave.exe"

echo ============================================
echo        OMNICAST - INICIALIZACAO
echo ============================================

REM Verificar Python portátil
if not exist "%PYTHON_PORTABLE%" (
    echo [ERRO] Python portátil não encontrado em "%PYTHON_PORTABLE%"!
    pause
    exit /b
)

REM Iniciar servidor HTTP
echo [INFO] A iniciar servidor HTTP na porta 8000...
start "Servidor Omnicast" cmd /k "%PYTHON_PORTABLE% -m http.server 8000"

REM Pequena pausa para garantir que o servidor arranca
timeout /t 2 >nul

REM Iniciar atualizador de status
if exist "..\update_status.py" (
    echo [INFO] A iniciar atualizador de status...
    set "STATUS_DATA_DIR=assets\data"
    start "Atualizador Status" cmd /k "%PYTHON_PORTABLE% ..\update_status.py"
) else (
    echo [AVISO] O ficheiro "update_status.py" não foi encontrado!
)

REM Abrir Brave portátil (a menos que seja passado argumento nobrowser)
if /I "%1"=="nobrowser" (
    echo [INFO] Navegador não será aberto (modo nobrowser).
) else (
    if exist "%BRAVE_PORTABLE%" (
        echo [INFO] A abrir Brave portátil...
        start "" "%BRAVE_PORTABLE%" "http://localhost:8000"
    ) else (
        echo [AVISO] Brave portátil não encontrado em "%BRAVE_PORTABLE%"!
    )
)

echo.
echo [OK] Servidores iniciados e navegador aberto (se disponível).
echo    - HTTP:   http://localhost:8000
echo    - Status: http://localhost:8081/status
echo ============================================
echo.
pause
