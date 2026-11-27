@echo off
chcp 65001 >nul
title Servidor seguro del sitio ABMC
cd /d "%~dp0"
python "%~dp0servidor.py"
pause
