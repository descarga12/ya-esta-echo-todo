@echo off
chcp 65001 >nul
echo ==========================================
echo  DIAGNOSTICO DSFD - Base de Datos y API
echo ==========================================
echo.

REM Verificar MySQL
echo [1] Verificando MySQL en puerto 3306...
netstat -an | findstr :3306 >nul
if %errorlevel% equ 0 (
    echo     [OK] MySQL esta corriendo en puerto 3306
) else (
    echo     [X] MySQL NO esta corriendo en puerto 3306
    echo     [TIP] Inicia Laragon y asegurate de que MySQL este activo
)
echo.

REM Verificar si existe mysql.exe de Laragon
echo [2] Buscando MySQL en Laragon...
if exist "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" (
    echo     [OK] MySQL encontrado en Laragon
) else if exist "C:\laragon\bin\mysql\*\bin\mysql.exe" (
    echo     [OK] MySQL encontrado en Laragon
) else (
    echo     [ADVERTENCIA] No se encontro mysql.exe en Laragon
)
echo.

REM Verificar base de datos
echo [3] Verificando base de datos "prueba"...
if exist "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" (
    "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root -e "USE prueba; SHOW TABLES;" 2>nul
    if %errorlevel% equ 0 (
        echo     [OK] Base de datos "prueba" existe y es accesible
    ) else (
        echo     [X] No se pudo conectar a la base de datos "prueba"
        echo     [TIP] Ejecuta: mysql -u root -e "CREATE DATABASE prueba;"
    )
) else (
    echo     [INFO] No se puede verificar - MySQL no disponible
)
echo.

REM Verificar servidor API
echo [4] Verificando servidor API en puerto 3000...
curl -s http://localhost:3000/api/ping >nul 2>nul
if %errorlevel% equ 0 (
    echo     [OK] Servidor API esta corriendo en puerto 3000
) else (
    echo     [X] Servidor API NO esta corriendo
    echo     [TIP] Ejecuta: pnpm dev
)
echo.

REM Verificar node_modules
echo [5] Verificando dependencias...
if exist "node_modules" (
    echo     [OK] node_modules existe
) else (
    echo     [X] node_modules NO existe
    echo     [TIP] Ejecuta: pnpm install
)
echo.

REM Verificar .env
echo [6] Verificando archivo .env...
if exist ".env" (
    echo     [OK] Archivo .env existe
) else (
    echo     [X] Archivo .env NO existe
    echo     [TIP] Copia .env.example a .env y configura los valores
)
echo.

echo ==========================================
echo  DIAGNOSTICO COMPLETADO
echo ==========================================
echo.
echo Pasos para corregir:
echo 1. Asegurate de que Laragon este iniciado con MySQL activo
echo 2. Ejecuta: pnpm install (si falta node_modules)
echo 3. Crea el archivo .env basado en .env.example
echo 4. Ejecuta: pnpm dev (para iniciar el servidor)
echo.
pause
