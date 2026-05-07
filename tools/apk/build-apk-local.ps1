# Script de PowerShell para compilar APK localmente
# Descarga Gradle y compila el APK sin Docker ni Android Studio

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  COMPILADOR APK LOCAL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Verificar Java
Write-Host "`n[1/6] Verificando Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1
    Write-Host "    Java encontrado" -ForegroundColor Green
} catch {
    Write-Host "    ERROR: Java no está instalado. Por favor instala JDK 17." -ForegroundColor Red
    exit 1
}

# Descargar Gradle si no existe
$gradleVersion = "8.2.1"
$gradleDir = "$env:USERPROFILE\.gradle\gradle-$gradleVersion"
$gradleZip = "$env:TEMP\gradle-$gradleVersion-bin.zip"

if (-not (Test-Path $gradleDir)) {
    Write-Host "`n[2/6] Descargando Gradle $gradleVersion..." -ForegroundColor Yellow
    
    $gradleUrl = "https://services.gradle.org/distributions/gradle-$gradleVersion-bin.zip"
    
    try {
        Invoke-WebRequest -Uri $gradleUrl -OutFile $gradleZip -UseBasicParsing
        Write-Host "    Gradle descargado" -ForegroundColor Green
        
        Write-Host "    Extrayendo Gradle..." -ForegroundColor Gray
        Expand-Archive -Path $gradleZip -DestinationPath "$env:USERPROFILE\.gradle" -Force
        Remove-Item $gradleZip
        Write-Host "    Gradle extraído" -ForegroundColor Green
    } catch {
        Write-Host "    ERROR: No se pudo descargar Gradle: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "`n[2/6] Gradle ya está instalado" -ForegroundColor Green
}

$env:PATH = "$gradleDir\bin;$env:PATH"

# Verificar estructura Android
Write-Host "`n[3/6] Verificando estructura Android..." -ForegroundColor Yellow

$androidDir = "$PSScriptRoot\android"
if (-not (Test-Path $androidDir)) {
    Write-Host "    ERROR: No existe la carpeta android/" -ForegroundColor Red
    exit 1
}

# Verificar gradlew
if (-not (Test-Path "$androidDir\gradlew.bat")) {
    Write-Host "    Creando gradlew.bat..." -ForegroundColor Gray
    @'
@echo off
set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"
set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
'@ | Out-File -FilePath "$androidDir\gradlew.bat" -Encoding ASCII
}

# Verificar gradle-wrapper.jar
if (-not (Test-Path "$androidDir\gradle\wrapper\gradle-wrapper.jar")) {
    Write-Host "    Descargando gradle-wrapper.jar..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path "$androidDir\gradle\wrapper" | Out-Null
    
    $wrapperUrl = "https://raw.githubusercontent.com/gradle/gradle/v8.2.1/gradle/wrapper/gradle-wrapper.jar"
    try {
        Invoke-WebRequest -Uri $wrapperUrl -OutFile "$androidDir\gradle\wrapper\gradle-wrapper.jar" -UseBasicParsing
        Write-Host "    gradle-wrapper.jar descargado" -ForegroundColor Green
    } catch {
        Write-Host "    ERROR: No se pudo descargar gradle-wrapper.jar" -ForegroundColor Red
        exit 1
    }
}

# Compilar web assets
Write-Host "`n[4/6] Compilando assets web..." -ForegroundColor Yellow
try {
    Set-Location $PSScriptRoot
    pnpm build:client
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    Write-Host "    Assets compilados" -ForegroundColor Green
} catch {
    Write-Host "    ERROR: No se pudieron compilar los assets: $_" -ForegroundColor Red
    exit 1
}

# Copiar assets a Android
Write-Host "`n[5/6] Copiando assets a Android..." -ForegroundColor Yellow
$publicDir = "$androidDir\app\src\main\assets\public"
New-Item -ItemType Directory -Force -Path $publicDir | Out-Null
Copy-Item -Path "$PSScriptRoot\dist\spa\*" -Destination $publicDir -Recurse -Force
Write-Host "    Assets copiados" -ForegroundColor Green

# Compilar APK
Write-Host "`n[6/6] Compilando APK (esto puede tardar varios minutos)..." -ForegroundColor Yellow
Write-Host "    Usando Gradle para compilar..." -ForegroundColor Gray

Set-Location $androidDir

try {
    # Usar gradle directamente en lugar de gradlew
    $gradleCmd = "$gradleDir\bin\gradle"
    & $gradleCmd assembleDebug --no-daemon 2>&1 | ForEach-Object {
        Write-Host "    $_" -ForegroundColor Gray
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n============================================" -ForegroundColor Green
        Write-Host "  APK COMPILADO EXITOSAMENTE!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        
        $apkPath = "$androidDir\app\build\outputs\apk\debug\app-debug.apk"
        if (Test-Path $apkPath) {
            $size = (Get-Item $apkPath).Length / 1MB
            Write-Host "`nUbicación: $apkPath" -ForegroundColor Cyan
            Write-Host "Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
            
            # Copiar a raíz para fácil acceso
            Copy-Item $apkPath "$PSScriptRoot\QR-Inventario.apk" -Force
            Write-Host "`nAPK copiado a: QR-Inventario.apk" -ForegroundColor Green
        }
    } else {
        throw "Gradle build failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Host "`n============================================" -ForegroundColor Red
    Write-Host "  ERROR AL COMPILAR" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nPresiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
