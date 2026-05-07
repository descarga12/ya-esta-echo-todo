# Script para compilar APK
cd "$PSScriptRoot"

# 1. Build del cliente
Write-Host "=== Paso 1: Build del cliente ===" -ForegroundColor Green
npm run build:client

# 2. Sync con Capacitor
Write-Host "=== Paso 2: Sincronizando con Capacitor ===" -ForegroundColor Green
npx cap sync android

# 3. Compilar APK
Write-Host "=== Paso 3: Compilando APK ===" -ForegroundColor Green
cd "$PSScriptRoot\android"
.\gradlew.bat clean
.\gradlew.bat assembleDebug

# 4. Verificar APK
$apkPath = "$PSScriptRoot\android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host "=== APK generado exitosamente ===" -ForegroundColor Green
    Write-Host "Ubicacion: $apkPath" -ForegroundColor Cyan
    Write-Host "Tamanio: $([math]::Round((Get-Item $apkPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "=== Error: APK no encontrado ===" -ForegroundColor Red
}
