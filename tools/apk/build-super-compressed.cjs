const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * SCRIPT DE CONSTRUCCIÓN SUPER COMPRIMIDA
 * Este script automatiza todo el proceso de generación del APK optimizado:
 * 1. Compila el cliente y el servidor.
 * 2. Elimina archivos redundantes para ahorrar espacio.
 * 3. Sincroniza con Capacitor.
 * 4. Compila el APK nativo usando Gradle.
 */

const distAssets = path.join(process.cwd(), 'dist', 'spa', 'assets');

try {
  // Paso 1: Compilar el Frontend (React SPA)
  console.log('Building client...');
  execSync('pnpm build:client', { stdio: 'inherit' });

  // Paso 2: Compilar el Backend (Node.js Express)
  console.log('Building server...');
  execSync('pnpm build:server', { stdio: 'inherit' });

  // Paso 3: Limpiar archivos comprimidos (GZIP/Brotli) del build web.
  // Capacitor ya comprime el contenido, por lo que estos archivos solo ocupan espacio extra en el APK.
  if (fs.existsSync(distAssets)) {
    console.log('Removing .gz and .br files to save APK space...');
    const deleteCompressed = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          deleteCompressed(fullPath);
        } else if (file.endsWith('.gz') || file.endsWith('.br')) {
          fs.unlinkSync(fullPath);
        }
      });
    };
    deleteCompressed(distAssets);
  }

  // Paso 4: Sincronizar los archivos web con el proyecto de Android nativo
  console.log('Syncing with Capacitor...');
  execSync('npx cap sync android', { stdio: 'inherit' });

  // Paso 5: Compilar el APK nativo usando el wrapper de Gradle
  console.log('Building APK (Debug)...');
  process.chdir('android');
  execSync('.\\gradlew assembleDebug', { stdio: 'inherit' });
  process.chdir('..');

  // Paso 6: Localizar los APKs generados y moverlos a la raíz del proyecto
  const apkDir = path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'debug');
  const apks = fs.readdirSync(apkDir).filter(f => f.endsWith('.apk'));
  
  if (apks.length > 0) {
    apks.forEach(apk => {
      const finalPath = path.join(process.cwd(), `QR_Inventario_${apk}`);
      fs.copyFileSync(path.join(apkDir, apk), finalPath);
      console.log('--------------------------------------------------');
      console.log(`¡ÉXITO! APK generado: ${finalPath}`);
      const stats = fs.statSync(finalPath);
      console.log(`Tamaño final: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log('--------------------------------------------------');
    });
  }

} catch (error) {
  // Manejo de errores durante cualquier paso del proceso
  console.error('Error durante la generación:', error);
  process.exit(1);
}
