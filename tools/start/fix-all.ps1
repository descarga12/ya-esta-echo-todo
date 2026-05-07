#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Script de diagnóstico y corrección para DSFD App
.DESCRIPTION
    Verifica y corrige problemas con MySQL, base de datos y servidor API
#>

$ErrorActionPreference = "Continue"

function Write-Status($message, $status, $color = "White") {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] " -NoNewline -ForegroundColor Gray
    Write-Host "[$status] " -NoNewline -ForegroundColor $color
    Write-Host $message
}

function Write-Section($title) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================
# INICIO DEL SCRIPT
# ============================================
Clear-Host
Write-Host "
========================================
  DSFD APP - DIAGNOSTICO Y CORRECCION
========================================
" -ForegroundColor Green

$issuesFound = @()
$fixesApplied = @()

# ============================================
# 1. VERIFICAR MYSQL
# ============================================
Write-Section "1. VERIFICANDO MYSQL"

$mysqlPort = 3306
$mysqlRunning = $false

try {
    $connection = Test-NetConnection -ComputerName localhost -Port $mysqlPort -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Status "MySQL está corriendo en puerto $mysqlPort" "OK" "Green"
        $mysqlRunning = $true
    } else {
        Write-Status "MySQL NO está corriendo en puerto $mysqlPort" "ERROR" "Red"
        $issuesFound += "MySQL no está corriendo"
    }
} catch {
    Write-Status "No se pudo verificar MySQL: $_" "ERROR" "Red"
    $issuesFound += "MySQL no está corriendo"
}

# Buscar procesos de MySQL
if (-not $mysqlRunning) {
    $mysqlProcess = Get-Process | Where-Object { $_.ProcessName -like "*mysql*" } | Select-Object -First 1
    if ($mysqlProcess) {
        Write-Status "Proceso MySQL encontrado (PID: $($mysqlProcess.Id)) pero no responde en puerto $mysqlPort" "WARN" "Yellow"
    }
    
    # Buscar Laragon
    $laragonPath = @(
        "C:\laragon\laragon.exe",
        "C:\Program Files\laragon\laragon.exe",
        "${env:ProgramFiles}\laragon\laragon.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if ($laragonPath) {
        Write-Status "Laragon encontrado en: $laragonPath" "INFO" "Blue"
        Write-Status "Por favor, inicia Laragon manualmente y activa MySQL" "ACTION" "Yellow"
    } else {
        Write-Status "Laragon no encontrado en las ubicaciones estándar" "WARN" "Yellow"
    }
}

# ============================================
# 2. VERIFICAR ARCHIVO .ENV
# ============================================
Write-Section "2. VERIFICANDO CONFIGURACIÓN .ENV"

$envPath = ".\.env"
$envExamplePath = ".\.env.example"

if (Test-Path $envPath) {
    Write-Status "Archivo .env encontrado" "OK" "Green"
    $envContent = Get-Content $envPath -Raw
    
    # Verificar configuración
    if ($envContent -match "DB_HOST") {
        $dbHost = [regex]::Match($envContent, "DB_HOST=(.+)?").Groups[1].Value.Trim()
        Write-Status "DB_HOST: $dbHost" "CONFIG" "Blue"
    }
    if ($envContent -match "DB_USER") {
        $dbUser = [regex]::Match($envContent, "DB_USER=(.+)?").Groups[1].Value.Trim()
        Write-Status "DB_USER: $dbUser" "CONFIG" "Blue"
    }
    if ($envContent -match "DB_NAME") {
        $dbName = [regex]::Match($envContent, "DB_NAME=(.+)?").Groups[1].Value.Trim()
        Write-Status "DB_NAME: $dbName" "CONFIG" "Blue"
    }
} else {
    Write-Status "Archivo .env NO encontrado" "ERROR" "Red"
    $issuesFound += "Falta archivo .env"
    
    if (Test-Path $envExamplePath) {
        Write-Status "Creando .env desde .env.example..." "ACTION" "Yellow"
        Copy-Item $envExamplePath $envPath
        Write-Status "Archivo .env creado" "FIXED" "Green"
        $fixesApplied += "Creado archivo .env desde .env.example"
    }
}

# ============================================
# 3. VERIFICAR NODE_MODULES
# ============================================
Write-Section "3. VERIFICANDO DEPENDENCIAS"

if (Test-Path ".\node_modules") {
    Write-Status "node_modules existe" "OK" "Green"
    
    # Verificar si mysql2 está instalado
    if (Test-Path ".\node_modules\mysql2") {
        Write-Status "mysql2 instalado" "OK" "Green"
    } else {
        Write-Status "mysql2 NO instalado" "ERROR" "Red"
        $issuesFound += "Falta mysql2"
    }
} else {
    Write-Status "node_modules NO existe" "ERROR" "Red"
    $issuesFound += "Faltan dependencias (node_modules)"
    
    # Verificar si pnpm está disponible
    $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
    $npm = Get-Command npm -ErrorAction SilentlyContinue
    
    if ($pnpm) {
        Write-Status "Instalando dependencias con pnpm..." "ACTION" "Yellow"
        & pnpm install
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Dependencias instaladas correctamente" "FIXED" "Green"
            $fixesApplied += "Instaladas dependencias con pnpm"
        }
    } elseif ($npm) {
        Write-Status "Instalando dependencias con npm..." "ACTION" "Yellow"
        & npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Dependencias instaladas correctamente" "FIXED" "Green"
            $fixesApplied += "Instaladas dependencias con npm"
        }
    } else {
        Write-Status "Ni pnpm ni npm encontrados" "ERROR" "Red"
    }
}

# ============================================
# 4. VERIFICAR SERVIDOR API
# ============================================
Write-Section "4. VERIFICANDO SERVIDOR API"

$apiPorts = @(3000, 8080)
$apiRunning = $false
$apiPort = 0

foreach ($port in $apiPorts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/api/ping" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Status "Servidor API respondiendo en puerto $port" "OK" "Green"
            $apiRunning = $true
            $apiPort = $port
            break
        }
    } catch {
        # No responde en este puerto
    }
}

if (-not $apiRunning) {
    Write-Status "Servidor API NO está corriendo en puertos $($apiPorts -join ', ')" "ERROR" "Red"
    $issuesFound += "Servidor API no está corriendo"
    
    Write-Status "Para iniciar el servidor, ejecuta: pnpm dev" "ACTION" "Yellow"
}

# ============================================
# 5. RESUMEN
# ============================================
Write-Section "5. RESUMEN"

if ($issuesFound.Count -eq 0) {
    Write-Host "  ✅ TODO ESTÁ CONFIGURADO CORRECTAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "  El servidor API está corriendo en: http://localhost:$apiPort" -ForegroundColor Cyan
    Write-Host "  MySQL está conectado y funcionando" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Puedes abrir la aplicación en tu navegador:" -ForegroundColor White
    Write-Host "  http://localhost:$apiPort" -ForegroundColor Yellow
} else {
    Write-Host "  ⚠️  SE ENCONTRARON $($issuesFound.Count) PROBLEMAS:" -ForegroundColor Yellow
    Write-Host ""
    foreach ($issue in $issuesFound) {
        Write-Host "    • $issue" -ForegroundColor Red
    }
    Write-Host ""
    
    if ($fixesApplied.Count -gt 0) {
        Write-Host "  ✅ CORRECCIONES APLICADAS:" -ForegroundColor Green
        foreach ($fix in $fixesApplied) {
            Write-Host "    • $fix" -ForegroundColor Green
        }
        Write-Host ""
    }
    
    Write-Host "  📋 ACCIONES PENDIENTES:" -ForegroundColor Cyan
    
    if ($issuesFound -contains "MySQL no está corriendo") {
        Write-Host "    1. Inicia Laragon y activa el servicio MySQL" -ForegroundColor White
    }
    
    if ($issuesFound -contains "Servidor API no está corriendo") {
        Write-Host "    2. Ejecuta: pnpm dev (en otra terminal)" -ForegroundColor White
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Guardar reporte
$reportPath = ".\diagnostic-report.txt"
$report = @"
DSFD Diagnostic Report
Generated: $(Get-Date)
=====================================

Issues Found: $($issuesFound.Count)
$(if ($issuesFound.Count -gt 0) { $issuesFound | ForEach-Object { "- $_" } })

Fixes Applied: $($fixesApplied.Count)
$(if ($fixesApplied.Count -gt 0) { $fixesApplied | ForEach-Object { "- $_" } })

MySQL Running: $mysqlRunning
API Running: $apiRunning $(if ($apiRunning) { "(Port: $apiPort)" })

=====================================
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8
Write-Status "Reporte guardado en: $reportPath" "INFO" "Blue"

Write-Host ""
Write-Host "Presiona cualquier tecla para salir..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
