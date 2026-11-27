@echo off
chcp 65001 >nul
setlocal

cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Git no esta instalado o no esta en PATH.
  echo Instala Git desde https://git-scm.com/download/win y vuelve a intentar.
  pause
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Esta carpeta no es un repositorio Git.
  echo Ejecuta primero la configuracion inicial (git init, git remote add origin ...).
  pause
  exit /b 1
)

echo == Estado ==
git status --short

echo.
echo == Agregando cambios ==
git add -A

git diff --cached --quiet
if %errorlevel%==0 (
  echo No hay cambios para subir.
  pause
  exit /b 0
)

for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set FECHA=%%c-%%a-%%b
for /f "tokens=1-2 delims=: " %%a in ("%time%") do set HORA=%%a:%%b
set MSG=Actualizacion sitio ABMC %FECHA% %HORA%

git commit -m "%MSG%"
if errorlevel 1 (
  echo [ERROR] No se pudo crear el commit.
  pause
  exit /b 1
)

echo.
echo == Subiendo a GitHub ==
git push
if errorlevel 1 (
  echo [ERROR] No se pudo hacer push. Verifica el remote, la rama y tu sesion de GitHub.
  pause
  exit /b 1
)

echo.
echo [OK] Cambios subidos a GitHub.
pause
