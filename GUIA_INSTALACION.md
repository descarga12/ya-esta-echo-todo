# Guía de Instalación y Uso - QR Inventario

Esta guía detalla los pasos necesarios para configurar, instalar y ejecutar la aplicación de gestión de inventario con códigos QR.

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

1.  **Node.js** (Versión 18 o superior)
2.  **PNPM** (Recomendado: `npm install -g pnpm`)
3.  **Laragon** (o un servidor MySQL local)
4.  **ngrok** (Opcional, para acceso externo)

---

## 🚀 Configuración Paso a Paso

### 1. Clonar o Descargar el Proyecto
Si aún no lo tienes localmente:
```bash
git clone https://github.com/descarga12/pro.git
cd pro
```

### 2. Configuración de la Base de Datos
1.  Inicia **Laragon** y pulsa en **"Start All"**.
2.  Accede a tu gestor de base de datos (HeidiSQL, phpMyAdmin, etc.).
3.  Crea una base de datos llamada `prueba`.
4.  (Opcional) El sistema intentará crear las tablas automáticamente al iniciar, pero asegúrate de tener los permisos de `root` sin contraseña (según la configuración por defecto).

### 3. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto (puedes copiar el `.env.example` si existe):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=prueba
```

### 4. Instalación de Dependencias
Ejecuta el siguiente comando en la terminal:
```bash
pnpm install
```

---

## 💻 Ejecución de la Aplicación

### Modo Desarrollo
Para iniciar el servidor de frontend y el backend simultáneamente con recarga automática:
```bash
pnpm dev
```
La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

### Acceso Externo (ngrok)
Si necesitas que la aplicación sea accesible desde un celular u otra red:
1.  Abre una nueva terminal.
2.  Ejecuta:
    ```bash
    ngrok http 3000
    ```
3.  Usa la URL `https://...` generada por ngrok.

---

## 📱 Uso en Android (Capacitor)

El proyecto está configurado para generar una aplicación nativa.

1.  **Sincronizar cambios**:
    ```bash
    pnpm run cap:sync
    ```
2.  **Abrir en Android Studio**:
    ```bash
    pnpm run cap:open:android
    ```
3.  **Generar APK**:
    Puedes usar los scripts en la carpeta `tools/apk/` o desde Android Studio (Build > Build Bundle(s) / APK(s) > Build APK(s)).

---

## 🛠️ Comandos Útiles

- `pnpm build`: Genera la versión de producción.
- `pnpm start`: Inicia el servidor de producción (requiere build previo).
- `pnpm typecheck`: Verifica errores de TypeScript.
- `node scripts/test-db-connection.js`: Prueba si la conexión a la base de datos es correcta.

---

## 💡 Notas Importantes
- Asegúrate de que **Laragon/MySQL** esté siempre iniciado antes de abrir la aplicación.
- Si cambias la estructura de la base de datos, revisa el archivo `server/lib/db.ts`.
- Los archivos subidos (imágenes) se guardan en la carpeta `public/uploads/`.
