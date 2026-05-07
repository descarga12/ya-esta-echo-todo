const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('============================================');
console.log('  COMPILADOR APK - NODE.JS');
console.log('============================================\n');

// Configuración
const androidDir = path.join(__dirname, 'android');
const gradleWrapperUrl = 'https://raw.githubusercontent.com/gradle/gradle/v8.2.1/gradle/wrapper/gradle-wrapper.jar';
const gradleWrapperPath = path.join(androidDir, 'gradle', 'wrapper', 'gradle-wrapper.jar');

// Verificar Android
console.log('[1/5] Verificando estructura Android...');
if (!fs.existsSync(androidDir)) {
    console.error('❌ No existe carpeta android/');
    process.exit(1);
}
console.log('✓ Android existe\n');

// Descargar gradle-wrapper.jar si no existe
console.log('[2/5] Verificando Gradle Wrapper...');
if (!fs.existsSync(gradleWrapperPath)) {
    console.log('   Descargando gradle-wrapper.jar...');
    
    const dir = path.dirname(gradleWrapperPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    const file = fs.createWriteStream(gradleWrapperPath);
    https.get(gradleWrapperUrl, (response) => {
        if (response.statusCode !== 200) {
            console.error(`❌ Error descargando: ${response.statusCode}`);
            process.exit(1);
        }
        
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log('✓ Gradle Wrapper descargado\n');
            continueBuild();
        });
    }).on('error', (err) => {
        console.error(`❌ Error: ${err.message}`);
        process.exit(1);
    });
} else {
    console.log('✓ Gradle Wrapper existe\n');
    continueBuild();
}

function continueBuild() {
    // Compilar web
    console.log('[3/5] Compilando aplicación web...');
    try {
        execSync('pnpm build:client', { stdio: 'inherit', cwd: __dirname });
        console.log('✓ Web compilada\n');
    } catch (e) {
        console.error('❌ Error compilando web:', e.message);
        process.exit(1);
    }
    
    // Copiar assets
    console.log('[4/5] Copiando assets a Android...');
    const publicDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const spaDir = path.join(__dirname, 'dist', 'spa');
    if (fs.existsSync(spaDir)) {
        copyFolderSync(spaDir, publicDir);
        console.log('✓ Assets copiados\n');
    } else {
        console.error('❌ No existe dist/spa/');
        process.exit(1);
    }
    
    // Compilar APK
    console.log('[5/5] Compilando APK...');
    console.log('   Esto puede tomar varios minutos...\n');
    
    try {
        const isWin = process.platform === 'win32';
        const gradlew = isWin ? 'gradlew.bat' : './gradlew';
        
        execSync(`${gradlew} assembleDebug --console=plain --no-daemon`, {
            stdio: 'inherit',
            cwd: androidDir,
            timeout: 600000 // 10 minutos
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
            console.log(`\n💡 Para instalar:`);
            console.log('   1. Transfiere el archivo a tu teléfono');
            console.log('   2. Habilita "Orígenes desconocidos" en ajustes');
            console.log('   3. Instala el APK');
        } else {
            console.error('\n❌ No se encontró el APK generado');
        }
    } catch (e) {
        console.error('\n❌ Error compilando APK:', e.message);
        process.exit(1);
    }
}

function copyFolderSync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}
