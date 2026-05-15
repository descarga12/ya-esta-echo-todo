const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const distAssets = path.join(process.cwd(), 'dist', 'spa', 'assets');

try {
  console.log('Building client...');
  execSync('pnpm build:client', { stdio: 'inherit' });

  if (fs.existsSync(distAssets)) {
    console.log('Removing .gz and .br files to save APK space...');
    const files = fs.readdirSync(distAssets);
    files.forEach(file => {
      if (file.endsWith('.gz') || file.endsWith('.br')) {
        fs.unlinkSync(path.join(distAssets, file));
      }
    });
  }

  console.log('Syncing with Capacitor...');
  execSync('npx cap sync android', { stdio: 'inherit' });

  console.log('Building APK (Debug)...');
  process.chdir('android');
  execSync('.\\gradlew assembleDebug', { stdio: 'inherit' });
  process.chdir('..');

  const apkPath = path.join(process.cwd(), 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  const finalPath = path.join(process.cwd(), 'QR_Inventario_Super_Comprimido.apk');

  if (fs.existsSync(apkPath)) {
    fs.copyFileSync(apkPath, finalPath);
    console.log('--------------------------------------------------');
    console.log(`¡ÉXITO! APK generado: ${finalPath}`);
    const stats = fs.statSync(finalPath);
    console.log(`Tamaño final: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('--------------------------------------------------');
  }

} catch (error) {
  console.error('Error durante la generación:', error);
  process.exit(1);
}
