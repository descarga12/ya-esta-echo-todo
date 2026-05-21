# Guía de Ejecución y Tecnologías Utilizadas

Esta guía explica cómo ejecutar la aplicación en diferentes dispositivos y detalla las librerías principales utilizadas en el proyecto.

## 1. Cómo ejecutar en otros dispositivos

### A. Dispositivos Android (Móviles y Tablets)
La forma más sencilla de ejecutar la app en Android es instalando el archivo APK que hemos generado:
1. Localiza el archivo `QR_Inventario_app-arm64-v8a-debug.apk` (o la versión correspondiente a tu procesador) en la raíz del proyecto.
2. Transfiere el archivo a tu dispositivo móvil.
3. Abre el archivo en tu celular y selecciona **Instalar** (asegúrate de permitir la instalación de aplicaciones de "fuentes desconocidas" en los ajustes de seguridad).
4. **Nota:** Para que la app móvil funcione, el servidor (backend) debe estar encendido y ser accesible desde la red.

### B. Computadoras (Navegador Web)
Si deseas ejecutar la aplicación en una PC:
1. Asegúrate de tener **Node.js** instalado.
2. Ejecuta el servidor:
   ```bash
   node dist/server/node-build.mjs
   ```
3. Abre tu navegador y entra a `http://localhost:3000`.

### C. En Red Local (Varios dispositivos)
Para que otros dispositivos en la misma red WiFi vean la app:
1. Obtén la IP de tu computadora (ej: `192.168.1.10`).
2. Los demás dispositivos pueden entrar desde el navegador a `http://192.168.1.10:3000`.

---

## 2. Librerías y Tecnologías Utilizadas

### Frontend (Interfaz de Usuario)
- **React + Vite**: Framework principal para una interfaz rápida y reactiva.
- **Tailwind CSS**: Para el diseño visual moderno y adaptable (responsive).
- **Radix UI**: Componentes de interfaz accesibles (modales, menús, botones).
- **Lucide React**: Iconos vectoriales elegantes.
- **TanStack Query (React Query)**: Gestión eficiente de datos y caché de la API.
- **React Router**: Manejo de la navegación entre páginas.

### Backend (Servidor y API)
- **Node.js + Express**: Motor del servidor y manejo de rutas.
- **MySQL2**: Conector para la base de datos relacional.
- **Bcryptjs**: Encriptación segura de contraseñas de usuarios.
- **Multer**: Gestión de subida de imágenes y archivos.
- **Compression**: Optimización de respuestas HTTP para mayor velocidad.

### Funciones Especiales
- **Capacitor**: Tecnología que permite convertir la web en una app nativa de Android.
- **jsPDF + AutoTable**: Generación de reportes profesionales en formato PDF.
- **html5-qrcode + ZXing**: Escaneo de códigos QR usando la cámara del dispositivo.
- **qr-code-styling**: Generación de códigos QR personalizados con logos.
- **Zod**: Validación de datos para asegurar que no haya errores en los formularios.

---

## 3. Requisitos para Desarrolladores
Si deseas modificar el código en otro equipo, necesitarás:
1. **Node.js** (v18 o superior).
2. **PNPM** o **NPM** (Gestor de paquetes).
3. **MySQL** (Base de datos).
4. **Android Studio** (Solo si deseas recompilar el APK nativo).
