@echo off
cd /d "c:\Users\jim\Desktop\laragon\www\DSFD-main"

echo === PASO 1: Build del cliente ===
call npm run build:client
if errorlevel 1 (
    echo ERROR: Fallo el build del cliente
    pause
    exit /b 1
)

echo === PASO 2: Sync Capacitor ===
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Fallo el sync de Capacitor
    pause
    exit /b 1
)

echo === PASO 3: Compilando APK ===
cd android
call .\gradlew.bat clean
call .\gradlew.bat assembleDebug
if errorlevel 1 (
    echo ERROR: Fallo la compilacion del APK
    pause
    exit /b 1
)

echo === VERIFICANDO APK ===
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo APK GENERADO EXITOSAMENTE
    echo Ubicacion: app\build\outputs\apk\debug\app-debug.apk
    for %%I in ("app\build\outputs\apk\debug\app-debug.apk") do (
        echo Tamano: %%~zI bytes
    )
) else (
    echo ERROR: APK no encontrado
)

pause
