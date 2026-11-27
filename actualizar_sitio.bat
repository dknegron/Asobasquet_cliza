@echo off
chcp 65001 >nul
title Actualizar sitio - Asociación Municipal de Básquetbol Cliza
cls
echo.
echo   ============================================================
echo     Actualizando el sitio: footer, firma digital, sitemap, JS
echo   ============================================================
echo.
python "C:\Users\LoL_ZeRo\Desktop\PROGRAMAR\Pagina_web_ABMC\actualizar_sitio.py"
if errorlevel 1 goto error
echo.
echo   Listo. Presiona una tecla para salir.
pause >nul
exit /b 0

:error
echo.
echo   ERROR: comprueba que Python esté instalado.
pause
exit /b 1
