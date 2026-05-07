@echo off
echo ==========================================
echo INSERTANDO DATOS DE PRUEBA EN MYSQL
echo ==========================================
echo.
echo Configuracion:
echo   Host: localhost
echo   Usuario: root
echo   Base de datos: prueba
echo.

REM Verificar si mysql esta disponible
where mysql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Comando 'mysql' no encontrado.
    echo Verifica que MySQL este instalado y en el PATH.
    echo.
    echo Intentando con ruta de Laragon...
    "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root -D prueba < sample-data.sql
    if %ERRORLEVEL% equ 0 (
        echo.
        echo ==========================================
        echo ✅ DATOS INSERTADOS EXITOSAMENTE
echo ==========================================
    ) else (
        echo.
        echo ==========================================
        echo ❌ ERROR AL INSERTAR DATOS
echo ==========================================
        echo.
        echo Intentalo manualmente:
echo 1. Abre phpMyAdmin o MySQL Workbench
echo 2. Selecciona la base de datos 'prueba'
echo 3. Importa el archivo 'sample-data.sql'
    )
    pause
    exit /b
)

REM Ejecutar SQL con mysql en PATH
mysql -u root -D prueba < sample-data.sql
if %ERRORLEVEL% equ 0 (
    echo.
    echo ==========================================
    echo ✅ DATOS INSERTADOS EXITOSAMENTE
echo ==========================================
    echo.
    echo Tablas pobladas:
    echo   - pre_unid_med_ptrabajo (5 unidades)
    echo   - pat_usu (5 usuarios)
    echo   - pat_bien (13 bienes)
    echo.
    echo Recarga el APK para ver los datos.
) else (
    echo.
    echo ==========================================
    echo ❌ ERROR AL INSERTAR DATOS
echo ==========================================
)

pause
