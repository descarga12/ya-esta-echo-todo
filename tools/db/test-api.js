/**
 * Script de prueba para verificar conexión a base de datos
 * y todas las funciones de la API
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { createServer } from './server/index.ts';
import http from 'http';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(title, message, color = 'reset') {
  console.log(`${colors[color]}[${title}]${colors.reset} ${message}`);
}

async function testDatabaseConnection() {
  log('DB', 'Probando conexión a MySQL...', 'cyan');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'prueba'
  };
  
  log('CONFIG', `Host: ${config.host}:${config.port}`, 'yellow');
  log('CONFIG', `Usuario: ${config.user}`, 'yellow');
  log('CONFIG', `Base de datos: ${config.database}`, 'yellow');
  
  let connection;
  try {
    connection = await mysql.createConnection(config);
    await connection.ping();
    log('DB', '✅ Conexión exitosa a MySQL', 'green');
    
    // Verificar tablas necesarias
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('app_qr_bienes', 'users', 'app_ubicaciones', 'roles', 'model_has_roles')
    `, [config.database]);
    
    log('DB', `Tablas encontradas: ${tables.length}`, 'cyan');
    tables.forEach(t => log('TABLE', `- ${t.TABLE_NAME}`, 'blue'));
    
    // Contar registros en tablas principales
    try {
      const [bienesCount] = await connection.query('SELECT COUNT(*) as total FROM app_qr_bienes');
      log('DATA', `Total bienes: ${bienesCount[0].total}`, 'green');
    } catch (e) {
      log('DATA', 'No se pudo contar bienes', 'red');
    }
    
    try {
      const [usersCount] = await connection.query('SELECT COUNT(*) as total FROM users WHERE estado = 1');
      log('DATA', `Usuarios activos: ${usersCount[0].total}`, 'green');
    } catch (e) {
      log('DATA', 'No se pudo contar usuarios', 'red');
    }
    
    await connection.end();
    return true;
  } catch (error) {
    log('DB', `❌ Error de conexión: ${error.message}`, 'red');
    if (connection) await connection.end();
    return false;
  }
}

async function testApiEndpoints() {
  log('API', 'Iniciando pruebas de endpoints...', 'cyan');
  
  const app = createServer();
  const server = http.createServer(app);
  
  await new Promise((resolve) => {
    server.listen(9999, () => {
      log('SERVER', 'Servidor de prueba iniciado en puerto 9999', 'green');
      resolve();
    });
  });
  
  const baseUrl = 'http://localhost:9999';
  const results = { passed: 0, failed: 0, tests: [] };
  
  async function testEndpoint(name, method, path, body = null) {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      const response = await fetch(`${baseUrl}${path}`, options);
      const data = await response.json().catch(() => null);
      
      const success = response.status >= 200 && response.status < 500;
      results.tests.push({ name, status: response.status, success, data: data?.message || data?.error || 'OK' });
      
      if (success) {
        results.passed++;
        log('TEST', `✅ ${name} (${response.status})`, 'green');
      } else {
        results.failed++;
        log('TEST', `❌ ${name} (${response.status})`, 'red');
      }
    } catch (error) {
      results.failed++;
      results.tests.push({ name, status: 'ERROR', success: false, data: error.message });
      log('TEST', `❌ ${name} - Error: ${error.message}`, 'red');
    }
  }
  
  // Probar endpoints
  await testEndpoint('GET /api', 'GET', '/api');
  await testEndpoint('GET /api/ping', 'GET', '/api/ping');
  await testEndpoint('GET /api/bienes', 'GET', '/api/bienes');
  await testEndpoint('GET /api/bienes/ubicaciones', 'GET', '/api/bienes/ubicaciones');
  await testEndpoint('GET /api/bienes/stats', 'GET', '/api/bienes/stats');
  await testEndpoint('GET /api/usuarios', 'GET', '/api/usuarios');
  await testEndpoint('GET /api/categorias', 'GET', '/api/categorias');
  await testEndpoint('GET /api/comprobantes', 'GET', '/api/comprobantes');
  await testEndpoint('GET /api/ingreso', 'GET', '/api/ingreso');
  await testEndpoint('GET /api/search?q=test', 'GET', '/api/search?q=test');
  
  // Test login
  await testEndpoint('POST /api/usuarios/login', 'POST', '/api/usuarios/login', { username: 'admin', password: 'admin123' });
  
  server.close();
  
  log('SUMMARY', `Pruebas pasadas: ${results.passed}`, 'green');
  log('SUMMARY', `Pruebas fallidas: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  
  return results;
}

async function runTests() {
  console.log('\n========================================');
  console.log('  PRUEBAS DE CONEXIÓN Y API - DSFD');
  console.log('========================================\n');
  
  // Test 1: Base de datos
  const dbConnected = await testDatabaseConnection();
  console.log('');
  
  // Test 2: API endpoints
  const apiResults = await testApiEndpoints();
  console.log('');
  
  // Resumen final
  console.log('========================================');
  console.log('           RESUMEN FINAL');
  console.log('========================================');
  log('DB', dbConnected ? '✅ Conectado' : '❌ No conectado', dbConnected ? 'green' : 'red');
  log('API', `${apiResults.passed}/${apiResults.passed + apiResults.failed} endpoints funcionando`, apiResults.failed === 0 ? 'green' : 'yellow');
  console.log('========================================\n');
  
  process.exit(dbConnected && apiResults.failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Error en pruebas:', err);
  process.exit(1);
});
