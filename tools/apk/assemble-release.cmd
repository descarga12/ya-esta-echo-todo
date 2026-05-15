@echo off
REM APK release optimizado (R8, recursos recortados, ABI ARM). Requiere sync previo o usa pnpm android:apk.
cd /d "%~dp0..\..\android"
if not exist "gradlew.bat" (
  echo ERROR: No se encuentra android\gradlew.bat.
  pause
  exit /b 1
)
call gradlew.bat assembleRelease %*
if errorlevel 1 (
  echo.
  echo Si falla: JDK 17, JAVA_HOME, y desde la raiz: pnpm run build:client ^&^& npx cap sync android
  pause
)
exit /b %ERRORLEVEL%
