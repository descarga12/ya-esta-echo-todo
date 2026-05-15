@echo off
REM Genera app-debug.apk desde la raíz del repo (no hace falta estar en la carpeta android).
cd /d "%~dp0..\..\android"
if not exist "gradlew.bat" (
  echo ERROR: No se encuentra android\gradlew.bat. Ejecuta este archivo desde el repo DSFD-main.
  pause
  exit /b 1
)
call gradlew.bat assembleDebug %*
if errorlevel 1 (
  echo.
  echo Si falla: instala JDK 17, define JAVA_HOME y vuelve a intentar.
  pause
)
exit /b %ERRORLEVEL%
