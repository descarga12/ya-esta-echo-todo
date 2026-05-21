# 📘 Manual de Configuración de Node.js

Esta guía te ayudará a configurar el entorno de **Node.js** en tu computadora para ejecutar este proyecto localmente sin necesidad de Docker.

## 1. Requisitos Previos
Para que el proyecto funcione, necesitas tener instalado:
- **Node.js**: Versión 18 o superior.
- **Laragon**: (O cualquier servidor MySQL local).
- **Git**: Para el control de versiones.

## 2. Instalación de Node.js
1. Ve a [nodejs.org](https://nodejs.org/).
2. Descarga e instala la versión **LTS** (Long Term Support).
3. Verifica la instalación abriendo una terminal y ejecutando:
   ```bash
   node -v
   npm -v
   ```

## 3. Instalación de PNPM
Este proyecto utiliza **pnpm** para gestionar las librerías de forma rápida. Instálalo globalmente con este comando:
```bash
npm install -g pnpm
```

## 4. Configuración del Proyecto
Sigue estos pasos dentro de la carpeta del proyecto (`DSFD-main`):

### A. Instalar Dependencias
Descarga todas las librerías necesarias ejecutando:
```bash
pnpm install
```

### B. Configurar Variables de Entorno
Asegúrate de tener un archivo llamado `.env` en la raíz del proyecto con la configuración de tu base de datos de Laragon:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=prueba
```

## 5. Comandos de Ejecución

| Comando | Acción | Descripción |
| :--- | :--- | :--- |
| `pnpm dev` | **Desarrollo** | Inicia el frontend y el backend con recarga automática. |
| `pnpm build` | **Compilar** | Genera la versión de producción optimizada. |
| `pnpm start` | **Producción** | Ejecuta la aplicación compilada. |
| `node tools/apk/build-super-compressed.cjs` | **Generar APK** | Crea el instalador para Android. |

## 6. Solución de Problemas Comunes
- **Error de conexión a la BD**: Asegúrate de que Laragon esté iniciado y que la base de datos `prueba` exista.
- **Módulos no encontrados**: Ejecuta `pnpm install` nuevamente para asegurar que todas las librerías se descargaron correctamente.
- **Puertos ocupados**: Si el puerto 3000 está en uso, puedes cambiarlo en el archivo `vite.config.ts`.

---
*Manual generado para el Sistema de Inventario QR - DSFD*
