# Script para generar APK usando Docker (Windows PowerShell)
# Uso: .\build-apk-docker.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Generando APK con Docker" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Verificar si Docker está instalado
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerInstalled) {
    Write-Host "ERROR: Docker no está instalado o no está en PATH" -ForegroundColor Red
    Write-Host "Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar si Docker está corriendo
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker no está corriendo"
    }
} catch {
    Write-Host "ERROR: Docker no está corriendo. Por favor inicia Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker está disponible" -ForegroundColor Green

# Construir la imagen Docker
Write-Host "`n[1/4] Construyendo imagen Docker..." -ForegroundColor Yellow
docker build -f Dockerfile.android -t qrinventario-android .

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo construir la imagen Docker" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Imagen construida exitosamente" -ForegroundColor Green

# Ejecutar contenedor para compilar APK
Write-Host "`n[2/4] Compilando APK (esto puede tomar varios minutos)..." -ForegroundColor Yellow
Write-Host "    Instalando dependencias..." -ForegroundColor Gray
docker run --rm -v "${PWD}:/app" qrinventario-android npm install

Write-Host "    Construyendo cliente web..." -ForegroundColor Gray
docker run --rm -v "${PWD}:/app" qrinventario-android npm run build:client

Write-Host "    Sincronizando con Capacitor..." -ForegroundColor Gray
docker run --rm -v "${PWD}:/app" qrinventario-android npx cap sync android

Write-Host "    Compilando APK..." -ForegroundColor Gray
docker run --rm -v "${PWD}:/app" -v "${PWD}/android:/app/android" qrinventario-android sh -c "cd android && gradle assembleDebug"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la compilación del APK" -ForegroundColor Red
    exit 1
}

Write-Host "✓ APK compilado exitosamente" -ForegroundColor Green

# Verificar que el APK existe
$apkPath = "android/app/build/outputs/apk/debug/app-debug.apk"
if (Test-Path $apkPath) {
    Write-Host "`n[3/4] APK generado correctamente!" -ForegroundColor Green
    Write-Host "    Ubicación: $apkPath" -ForegroundColor Cyan
    
    # Mostrar tamaño del archivo
    $fileSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "    Tamaño: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: No se encontró el archivo APK generado" -ForegroundColor Red
    Write-Host "Buscando en otras ubicaciones..." -ForegroundColor Yellow
    Get-ChildItem -Path "android" -Recurse -Filter "*.apk" -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "`n[4/4] Proceso completado!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Para instalar el APK en tu dispositivo:" -ForegroundColor White
Write-Host "  1. Transfiere el archivo a tu teléfono" -ForegroundColor Gray
Write-Host "  2. Habilita 'Origenes desconocidos' en ajustes" -ForegroundColor Gray
Write-Host "  3. Instala el APK" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
