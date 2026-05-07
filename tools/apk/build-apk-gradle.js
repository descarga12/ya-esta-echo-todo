const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('============================================');
console.log('  COMPILANDO APK CON GRADLE');
console.log('============================================\n');

const wrapperUrl = 'https://raw.githubusercontent.com/gradle/gradle/v8.2.1/gradle/wrapper/gradle-wrapper.jar';
const wrapperPath = path.join(__dirname, 'android', 'gradle', 'wrapper', 'gradle-wrapper.jar');

// Descargar gradle-wrapper.jar
console.log('[1/3] Descargando gradle-wrapper.jar...');

if (!fs.existsSync(path.dirname(wrapperPath))) {
    fs.mkdirSync(path.dirname(wrapperPath), { recursive: true });
}

const file = fs.createWriteStream(wrapperPath);
https.get(wrapperUrl, (response) => {
    if (response.statusCode !== 200) {
        console.error(`❌ Error descargando: ${response.statusCode}`);
        process.exit(1);
    }
    
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('✓ gradle-wrapper.jar descargado\n');
        compileAPK();
    });
}).on('error', (err) => {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
});

function compileAPK() {
    // Verificar assets
    console.log('[2/3] Verificando assets web...');
    const publicDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'assets', 'public');
    if (!fs.existsSync(publicDir)) {
        console.log('   Creando directorio de assets...');
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const distDir = path.join(__dirname, 'dist', 'spa');
    if (!fs.existsSync(distDir)) {
        console.error('❌ No existe dist/spa. Ejecuta primero: pnpm build:client');
        process.exit(1);
    }
    console.log('✓ Assets listos\n');
    
    // Compilar APK
    console.log('[3/3] Compilando APK con Gradle...');
    console.log('   Esto puede tardar varios minutos...\n');
    
    try {
        const androidDir = path.join(__dirname, 'android');
        execSync('.\\gradlew.bat assembleDebug --console=plain --no-daemon', {
            cwd: androidDir,
            stdio: 'inherit',
            timeout: 600000
        });
        
        // Verificar APK
        const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
        if (fs.existsSync(apkPath)) {
            const targetPath = path.join(__dirname, 'QR-Inventario.apk');
            fs.copyFileSync(apkPath, targetPath);
            
            const stats = fs.statSync(targetPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            
            console.log('\n============================================');
            console.log('  ✅ APK GENERADO EXITOSAMENTE!');
            console.log('============================================');
            console.log(`\n📱 Archivo: QR-Inventario.apk`);
            console.log(`📊 Tamaño: ${sizeMB} MB`);
        } else {
            console.error('\n❌ No se encontró el APK generado');
        }
    } catch (e) {
        console.error('\n❌ Error al compilar:', e.message);
        process.exit(1);
    }
}
