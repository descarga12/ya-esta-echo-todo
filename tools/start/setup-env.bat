@echo off
chcp 65001 >nul
echo ==========================================
echo  CONFIGURACION DE ENTORNO DSFD
echo ==========================================
echo.

if not exist ".env" (
    echo [INFO] Creando archivo .env desde .env.example...
    copy .env.example .env
    echo [OK] Archivo .env creado
    echo.
    echo [IMPORTANTE] Revisa el archivo .env y configura:
    echo    - DB_HOST=localhost (normalmente correcto)
    echo    - DB_USER=root (segun tu Navicat)
    echo    - DB_PASS= (deja vacio si no tienes password)
    echo    - DB_NAME=prueba
echo.
) else (
    echo [INFO] El archivo .env ya existe
echo    Contenido actual:
echo    -------------------
    type .env
echo    -------------------
)

echo.
echo [TIP] Si necesitas modificar la configuracion:
echo    - Edita el archivo .env con VS Code
echo    - O ejecuta: notepad .env
echo.
pause
