# Pasos para generar APK con Capacitor (Android)

1) Instalar dependencias (en tu máquina local):

   npm install

2) Preparar la webapp y el proyecto Capacitor:

   npm run build:client
   npm run cap:init

   Nota: si ya inicializaste antes, puedes omitir cap:init.

3) Añadir plataforma Android y sincronizar plugins:

   npm run cap:add:android
   npm run cap:sync

4) Abrir Android Studio:

   npm run cap:open:android

   - Android Studio cargará la carpeta `android/` generada.
   - Desde Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s).

5) Plugins nativos (ya añadidos como dependencias en package.json):

   - @capacitor/camera (para tomar fotos nativas)
   - @capacitor-community/barcode-scanner (escaneo nativo de códigos)

   Si necesitas reinstalarlos manualmente: `npm install @capacitor/camera @capacitor-community/barcode-scanner` y luego `npx cap sync`.

Notas importantes:
- Debes tener instalado Android Studio y configurar el SDK/Java en tu máquina local.
- Este repositorio ya incluye `capacitor.config.json` apuntando a `dist/spa` (la salida de `vite build`).
- Para pruebas rápidas en Android emulator, usa Build > Run.

Si quieres, puedo:
- Añadir integración para subir fotos a Supabase (recomendado para sincronizar entre dispositivos).
- Crear una pantalla de impresión/etiquetas dentro de la app.

Dime si quieres que agregue la integración con Supabase ahora (te indicaré cómo conectar desde la pestaña de MCP).
