@echo off
chcp 65001 >nul
echo ==========================================
echo  INICIANDO SERVIDOR DSFD
echo ==========================================
echo.

REM Verificar si pnpm está disponible
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] pnpm no encontrado. Instalando...
    npm install -g pnpm
)

REM Verificar node_modules
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    pnpm install
)

echo [INFO] Iniciando servidor de desarrollo...
echo [INFO] La API estara disponible en: http://localhost:3000
echo [INFO] Presiona Ctrl+C para detener
echo.

pnpm dev

pause
