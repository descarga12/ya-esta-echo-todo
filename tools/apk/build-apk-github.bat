@echo off
chcp 65001 >nul
cls
echo ============================================
echo   GENERAR APK CON GITHUB ACTIONS
echo ============================================
echo.
echo Este script configura GitHub Actions para compilar
echo el APK automaticamente en la nube.
echo.
echo Requisitos:
echo   - Tener una cuenta en GitHub
echo   - Tener Git instalado
echo.
echo ============================================
echo.

REM Verificar si es un repositorio git
if not exist .git (
    echo [1/5] Inicializando repositorio Git...
    git init
    git config user.email "tu@email.com"
    git config user.name "Tu Nombre"
) else (
    echo [1/5] Repositorio Git ya existe
)

echo.
echo [2/5] Agregando archivos al repositorio...
git add .
git commit -m "Preparar para compilar APK en GitHub Actions" 2>nul
if errorlevel 1 (
    echo      No hay cambios nuevos para commitear
) else (
    echo      Cambios commiteados exitosamente
)

echo.
echo [3/5] Configurando GitHub Actions...
echo      El archivo .github/workflows/build-apk.yml ya esta creado
echo.

echo [4/5] Instrucciones para conectar con GitHub:
echo.
echo   OPCION A - Crear repositorio nuevo:
echo      1. Ve a https://github.com/new
echo      2. Crea un repositorio (ej: qr-inventario)
echo      3. Copia la URL del repositorio
echo      4. Ejecuta: git remote add origin URL
echo      5. Ejecuta: git branch -M main
echo      6. Ejecuta: git push -u origin main
echo.
echo   OPCION B - Si ya tienes repositorio:
echo      1. Ejecuta: git remote add origin TU_URL
echo      2. Ejecuta: git push -u origin main
echo.

echo [5/5] Una vez subido el codigo:
echo      1. Ve a tu repositorio en GitHub
echo      2. Click en "Actions" (pestaña superior)
echo      3. Selecciona el workflow "Build Android APK"
echo      4. Click en "Run workflow" → "Run workflow"
echo      5. Espera 5-10 minutos
echo      6. Descarga el APK desde "Artifacts"
echo.
echo ============================================
echo   Alternativa: EAS Build (Expo)
echo ============================================
echo.
echo Si prefieres usar EAS (servicio de Expo):
echo   1. Instala EAS CLI: npm install -g eas-cli
echo   2. Login: eas login
echo   3. Configura proyecto: eas build:configure
echo   4. Compila: eas build --platform android --profile preview
echo.
echo ============================================
pause
