#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Inicia todo: MySQL (si es posible), verifica .env, instala dependencias e inicia el servidor
#>

$ErrorActionPreference = "Continue"

function Write-Status($message, $type = "INFO") {
    $colors = @{ "OK" = "Green"; "ERROR" = "Red"; "WARN" = "Yellow"; "INFO" = "Cyan"; "ACTION" = "Magenta" }
    $color = $colors[$type]
    Write-Host "[$type] " -NoNewline -ForegroundColor $color
    Write-Host $message
}

Clear-Host
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INICIANDO SERVIDOR DSFD COMPLETO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. VERIFICAR MySQL
# ============================================
Write-Status "Verificando MySQL en puerto 3306..." "INFO"

try {
    $test = Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue -ErrorAction Stop
    if ($test.TcpTestSucceeded) {
        Write-Status "✓ MySQL está corriendo en puerto 3306" "OK"
    } else {
        Write-Status "✗ MySQL NO está corriendo en puerto 3306" "ERROR"
        Write-Status "Por favor inicia Laragon y activa MySQL" "WARN"
        Write-Host ""
        $continue = Read-Host "¿Deseas continuar de todos modos? (s/n)"
        if ($continue -ne "s") {
            exit 1
        }
    }
} catch {
    Write-Status "No se pudo verificar MySQL: $_" "ERROR"
}

Write-Host ""

# ============================================
# 2. VERIFICAR/Crear .env
# ============================================
Write-Status "Verificando archivo .env..." "INFO"

if (Test-Path ".\.env") {
    Write-Status "✓ Archivo .env existe" "OK"
} else {
    Write-Status "✗ Archivo .env NO existe" "ERROR"
    if (Test-Path ".\.env.example") {
        Write-Status "Creando .env desde .env.example..." "ACTION"
        Copy-Item ".\.env.example" ".\.env"
        Write-Status "✓ Archivo .env creado" "OK"
    } else {
        Write-Status "Creando .env con configuración por defecto..." "ACTION"
        @"
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=prueba
"@ | Out-File -FilePath ".\.env" -Encoding UTF8
        Write-Status "✓ Archivo .env creado con valores por defecto" "OK"
    }
}

Write-Host ""

# ============================================
# 3. VERIFICAR/Instalar dependencias
# ============================================
Write-Status "Verificando node_modules..." "INFO"

if (Test-Path ".\node_modules") {
    Write-Status "✓ node_modules existe" "OK"
} else {
    Write-Status "✗ node_modules NO existe" "ERROR"
    
    # Buscar pnpm o npm
    $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    
    if ($pnpm) {
        Write-Status "Instalando dependencias con pnpm..." "ACTION"
        & pnpm install
        if ($LASTEXITCODE -eq 0) {
            Write-Status "✓ Dependencias instaladas" "OK"
        } else {
            Write-Status "✗ Error al instalar dependencias" "ERROR"
            exit 1
        }
    } elseif ($npm) {
        Write-Status "Instalando dependencias con npm..." "ACTION"
        & npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Status "✓ Dependencias instaladas" "OK"
        } else {
            Write-Status "✗ Error al instalar dependencias" "ERROR"
            exit 1
        }
    } else {
        Write-Status "✗ Ni pnpm ni npm encontrados" "ERROR"
        exit 1
    }
}

Write-Host ""

# ============================================
# 4. VERIFICAR si ya hay un servidor corriendo
# ============================================
Write-Status "Verificando si el servidor ya está corriendo..." "INFO"

$ports = @(3000, 8080, 5173)
$serverRunning = $false
foreach ($port in $ports) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/api/ping" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Status "✓ Servidor ya está corriendo en puerto $port" "OK"
            $serverRunning = $true
            break
        }
    } catch {
        # No responde en este puerto
    }
}

if ($serverRunning) {
    Write-Status "El servidor ya está activo. Abriendo navegador..." "INFO"
    Start-Process "http://localhost:3000"
    exit 0
}

# ============================================
# 5. INICIAR SERVIDOR
# ============================================
Write-Host ""
Write-Status "Iniciando servidor de desarrollo..." "ACTION"
Write-Status "La API estará disponible en: http://localhost:3000" "INFO"
Write-Status "Presiona Ctrl+C para detener" "WARN"
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Ejecutar pnpm dev
pnpm dev
