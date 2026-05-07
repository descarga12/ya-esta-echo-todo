# Script simple sin requerir administrador
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
Write-Host "  INICIANDO SERVIDOR DSFD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar .env
Write-Status "Verificando .env..." "INFO"
if (Test-Path ".\.env") {
    Write-Status "✓ .env existe" "OK"
} else {
    Write-Status "Creando .env..." "ACTION"
    @"
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=prueba
"@ | Out-File -FilePath ".\.env" -Encoding UTF8
    Write-Status "✓ .env creado" "OK"
}

# 2. Verificar node_modules
Write-Status "Verificando dependencias..." "INFO"
if (Test-Path ".\node_modules") {
    Write-Status "✓ node_modules existe" "OK"
} else {
    Write-Status "Instalando dependencias..." "ACTION"
    & pnpm install
    if ($LASTEXITCODE -eq 0) {
        Write-Status "✓ Dependencias instaladas" "OK"
    } else {
        Write-Status "Error al instalar. Intenta manualmente: pnpm install" "ERROR"
        exit 1
    }
}

# 3. Iniciar servidor
Write-Host ""
Write-Status "Iniciando servidor en http://localhost:3000" "INFO"
Write-Status "Presiona Ctrl+C para detener" "WARN"
Write-Host ""

& pnpm dev
