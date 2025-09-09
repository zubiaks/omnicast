@echo off
setlocal enabledelayedexpansion

REM Caminho completo para o Inkscape
set INKSCAPE="C:\Program Files\Inkscape\bin\inkscape.exe"

REM Pasta de destino
set DEST=assets\img\icons

REM Criar pasta se não existir
if not exist "%DEST%" mkdir "%DEST%"

REM Lista de tamanhos
for %%S in (192 256 384 512) do (
    echo Exportando icon-symbol-%%S.png...
    %INKSCAPE% icon-symbol.svg -o "%DEST%\icon-symbol-%%S.png" -w %%S -h %%S

    echo Exportando icon-text-%%S.png...
    %INKSCAPE% icon-text.svg -o "%DEST%\icon-text-%%S.png" -w %%S -h %%S
)

REM Versões maskable (512px)
echo Exportando icon-symbol-maskable.png...
%INKSCAPE% icon-symbol.svg -o "%DEST%\icon-symbol-maskable.png" -w 512 -h 512

echo Exportando icon-text-maskable.png...
%INKSCAPE% icon-text.svg -o "%DEST%\icon-text-maskable.png" -w 512 -h 512

echo.
echo ✅ Todos os ícones foram gerados em "%DEST%"
pause
