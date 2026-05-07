@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   INICIANDO SERVIDOR DSFD
echo ========================================
echo.

REM Verificar .env
if not exist ".env" (
    echo [INFO] Creando .env...
    (
        echo DB_HOST=localhost
        echo DB_PORT=3306
        echo DB_USER=root
        echo DB_PASS=
        echo DB_NAME=prueba
    ) > .env
    echo [OK] .env creado
) else (
    echo [OK] .env existe
)
echo.

REM Verificar node_modules
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    pnpm install
    if errorlevel 1 (
        echo [ERROR] Error al instalar dependencias
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
) else (
    echo [OK] node_modules existe
)
echo.

REM Iniciar servidor
echo [INFO] Iniciando servidor...
echo [INFO] URL: http://localhost:3000
echo [INFO] Presiona Ctrl+C para detener
echo.
echo ========================================
echo.

pnpm dev
