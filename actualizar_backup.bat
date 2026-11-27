@echo off
chcp 65001 >nul
title Actualizar copia de seguridad del sitio
setlocal
set SITIO=C:\Users\LoL_ZeRo\Desktop\PROGRAMAR\Pagina_web_ABMC
set DEST=C:\Users\LoL_ZeRo\Desktop\backups\web-Pagina_web_ABMC

cls
echo.
echo   Actualizando la copia de seguridad del sitio...
echo   Destino: %DEST%
echo.
robocopy "%SITIO%" "%DEST%" /MIR /R:3 /W:5 /XJ
if errorlevel 8 echo   Advertencia: se encontraron archivos que no se pudieron copiar.
echo.
echo   Copia actualizada.
pause
