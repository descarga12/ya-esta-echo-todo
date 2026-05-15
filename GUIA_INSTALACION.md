# Guía Completa de Instalación y Configuración - QR Inventario

Esta guía proporciona instrucciones detalladas para instalar todas las herramientas necesarias y configurar el proyecto desde cero.

---

## 🛠️ 1. Instalación de Herramientas (Software Base)

Asegúrate de instalar cada uno de estos componentes en el orden indicado:

### A. Git (Control de Versiones)
1. Descárgalo desde [git-scm.com](https://git-scm.com/).
2. Sigue el instalador (puedes dejar las opciones por defecto).
3. Verifica en la terminal con: `git --version`.

### B. Node.js (Entorno de Ejecución)
1. Descarga la versión **LTS** (Recomendada) desde [nodejs.org](https://nodejs.org/).
2. Instala y verifica con: `node -v`.

### C. PNPM (Gestor de Paquetes)
Una vez instalado Node.js, abre una terminal y ejecuta:
```bash
npm install -g pnpm
```
Verifica con: `pnpm -v`.

### D. Laragon (Servidor Local y MySQL)
1. Descarga **Laragon Full** desde [laragon.org](https://laragon.org/download/).
2. Instálalo (preferiblemente en `C:\laragon`).
3. Esto instalará automáticamente **MySQL**, **PHP** y **Apache**.

### E. Android Studio & Java (Para la App Móvil)
1. Descarga e instala [Android Studio](https://developer.android.com/studio).
2. Durante la instalación, asegúrate de instalar el **Android SDK** y el **Android SDK Platform-Tools**.
3. Instala el **Java JDK 17** (necesario para Android): [Descargar JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html).

---

## 🚀 2. Configuración del Proyecto

### Paso 1: Obtener el Código
Abre una terminal (o Git Bash) y clona el repositorio:
```bash
git clone https://github.com/descarga12/pro.git
cd pro
```

### Paso 2: Instalar Dependencias del Proyecto
Dentro de la carpeta del proyecto, ejecuta:
```bash
pnpm install
```

### Paso 3: Configurar la Base de Datos
1. Abre **Laragon** y haz clic en **"Start All"**.
2. Haz clic en el botón **"Database"** (HeidiSQL).
3. Crea una nueva base de datos llamada `prueba`.
4. El usuario por defecto es `root` y la contraseña está vacía.

### Paso 4: Archivo de Configuración (.env)
Crea un archivo llamado `.env` en la raíz del proyecto con este contenido:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=prueba
```

---

## 💻 3. Cómo Ejecutar la Aplicación

### Servidor de Desarrollo (Web)
Para iniciar la aplicación (Frontend + Backend):
```bash
pnpm dev
```
Acceso: [http://localhost:3000](http://localhost:3000)

### Acceso desde Celular (ngrok)
Si quieres probar la cámara del celular o entrar desde internet:
1. Instala ngrok: `pnpm install -g ngrok` (o descárgalo de [ngrok.com](https://ngrok.com/)).
2. Ejecuta: `ngrok http 3000`.
3. Usa la URL `https://...` que te proporcione ngrok.

---

## 📱 4. Generar la Aplicación Android (.APK)

1. **Sincronizar Capacitor**:
   ```bash
   pnpm run cap:sync
   ```
2. **Abrir en Android Studio**:
   ```bash
   pnpm run cap:open:android
   ```
3. **Generar APK**:
   - En Android Studio: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
   - El archivo se generará en: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## � 5. Solución de Problemas Comunes

- **Error "ECONNREFUSED"**: MySQL no está iniciado en Laragon. Dale a "Start All".
- **Error "Permission Denied (publickey)"**: Usa la URL HTTPS para Git o configura tus llaves SSH en GitHub.
- **La cámara no abre**: Asegúrate de estar usando una conexión segura (`https`) a través de ngrok o localhost.

---

## �️ Comandos de Mantenimiento
- `pnpm build`: Prepara la app para producción.
- `node scripts/test-db-connection.js`: Verifica si el servidor llega a la base de datos.
- `pnpm typecheck`: Busca errores en el código TypeScript.
