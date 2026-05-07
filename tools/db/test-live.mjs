/**
 * Pruebas en vivo - Conexión DB y API
 * Ejecutar: node test-live.mjs
 */
import mysql from 'mysql2/promise';
import http from 'http';
import { createServer } from './dist/server/node-build.mjs';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (label, msg, color = 'reset') => 
  console.log(`${colors[color]}[${label}]${colors.reset} ${msg}`);

console.log('\n========================================');
console.log('  PRUEBAS EN VIVO - DSFD APP');
console.log('========================================\n');

// Test 1: Conexión a Base de Datos
log('TEST', '1. Probando conexión MySQL...', 'cyan');

try {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: ''
  });
  
  await conn.ping();
  log('DB', '✅ Conexión MySQL exitosa', 'green');
  
  // Verificar base de datos
  const [dbs] = await conn.query("SHOW DATABASES LIKE 'prueba'");
  if (dbs.length > 0) {
    log('DB', '✅ Base de datos "prueba" existe', 'green');
    await conn.query('USE prueba');
    
    // Contar registros
    const [bienes] = await conn.query('SELECT COUNT(*) as n FROM app_qr_bienes');
    const [users] = await conn.query('SELECT COUNT(*) as n FROM users WHERE estado=1');
    const [ubicaciones] = await conn.query('SELECT COUNT(*) as n FROM app_ubicaciones');
    
    log('DATA', `Bienes: ${bienes[0].n}`, 'blue');
    log('DATA', `Usuarios activos: ${users[0].n}`, 'blue');
    log('DATA', `Ubicaciones: ${ubicaciones[0].n}`, 'blue');
  } else {
    log('DB', '⚠️ Base de datos "prueba" no existe', 'yellow');
  }
  
  await conn.end();
} catch (err) {
  log('DB', `❌ Error: ${err.message}`, 'red');
  if (err.code === 'ECONNREFUSED') {
    log('HINT', '💡 Asegúrate de que Laragon/MySQL esté corriendo', 'yellow');
  }
  process.exit(1);
}

// Test 2: Iniciar servidor Express y probar endpoints
console.log('');
log('TEST', '2. Iniciando servidor Express...', 'cyan');

try {
  // Importar el módulo de servidor
  const { createServer: createApp } = await import('./server/index.ts');
  const app = createApp();
  const server = http.createServer(app);
  
  await new Promise((resolve, reject) => {
    server.listen(9999, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  log('SERVER', '✅ Servidor iniciado en puerto 9999', 'green');
  
  // Probar endpoints
  console.log('');
  log('TEST', '3. Probando endpoints...', 'cyan');
  
  const tests = [
    { name: 'Ping', url: 'http://localhost:9999/api/ping' },
    { name: 'API Info', url: 'http://localhost:9999/api' },
    { name: 'Bienes', url: 'http://localhost:9999/api/bienes' },
    { name: 'Ubicaciones', url: 'http://localhost:9999/api/bienes/ubicaciones' },
    { name: 'Stats', url: 'http://localhost:9999/api/bienes/stats' },
    { name: 'Usuarios', url: 'http://localhost:9999/api/usuarios' },
    { name: 'Categorías', url: 'http://localhost:9999/api/categorias' },
    { name: 'Comprobantes', url: 'http://localhost:9999/api/comprobantes' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const res = await fetch(test.url);
      if (res.ok) {
        log('API', `✅ ${test.name} (${res.status})`, 'green');
        passed++;
      } else {
        log('API', `⚠️ ${test.name} (${res.status})`, 'yellow');
        failed++;
      }
    } catch (e) {
      log('API', `❌ ${test.name} - ${e.message}`, 'red');
      failed++;
    }
  }
  
  // Test de login
  console.log('');
  log('TEST', '4. Probando login...', 'cyan');
  
  try {
    const loginRes = await fetch('http://localhost:9999/api/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    if (loginRes.ok) {
      const data = await loginRes.json();
      log('LOGIN', `✅ Login exitoso - Usuario: ${data.user?.nombre || data.user?.username}`, 'green');
      passed++;
    } else {
      const err = await loginRes.json().catch(() => ({}));
      log('LOGIN', `⚠️ Login respondió ${loginRes.status}: ${err.error || 'Unknown'}`, 'yellow');
      failed++;
    }
  } catch (e) {
    log('LOGIN', `❌ Error: ${e.message}`, 'red');
    failed++;
  }
  
  server.close();
  
  // Resumen
  console.log('');
  console.log('========================================');
  log('SUMMARY', `✅ Pruebas pasadas: ${passed}`, 'green');
  if (failed > 0) log('SUMMARY', `⚠️ Pruebas con advertencias: ${failed}`, 'yellow');
  console.log('========================================');
  
} catch (err) {
  log('ERROR', `❌ ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
}
