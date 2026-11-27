@echo off
chcp 65001 >nul
title Instalar escaneo diario del sitio ABMC
setlocal
set SITIO=C:\Users\LoL_ZeRo\Desktop\PROGRAMAR\Pagina_web_ABMC
set TAREA=EscaneoDiarioSitioABMC

echo.
echo   Creando la tarea de escaneo diario del sitio...
echo.
echo   Salida estimada: los logs en %SITIO%\logs
echo.
schtasks /Create /TN "%TAREA%" /SC DAILY /ST 02:00 /TR "python \"%SITIO%\scan_site.py\"" /F

if errorlevel 1 (
  echo   ERROR: no se pudo crear la tarea. Revisa si tienes permisos de administrador.
) else (
  echo   Tarea "%TAREA%" creada. Se ejecutará diariamente a las 02:00.
)
echo.
echo   Para ejecutar una vez ahora: python "%SITIO%\scan_site.py"
echo.
pause
