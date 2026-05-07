/**
 * Script de prueba para verificar conexión a base de datos MySQL
 * Ejecutar con: pnpm tsx test-db.ts
 */
import mysql from 'mysql2/promise';
import 'dotenv/config';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(title: string, message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}[${title}]${colors.reset} ${message}`);
}

async function testConnection() {
  console.log('\n========================================');
  console.log('  PRUEBA DE CONEXIÓN A BASE DE DATOS');
  console.log('========================================\n');

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
  console.log('');

  let connection: mysql.Connection | null = null;

  try {
    // Intentar conectar
    log('DB', 'Intentando conectar a MySQL...', 'cyan');
    connection = await mysql.createConnection(config);

    // Test ping
    await connection.ping();
    log('DB', '✅ Conexión exitosa a MySQL', 'green');

    // Verificar versión
    const [versionRows] = await connection.query('SELECT VERSION() as version');
    log('DB', `Versión MySQL: ${(versionRows as any)[0].version}`, 'blue');

    // Verificar tablas necesarias para la app
    log('DB', 'Verificando tablas necesarias...', 'cyan');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME IN ('app_qr_bienes', 'users', 'app_ubicaciones', 'roles', 'model_has_roles', 'categoria', 'articulo', 'comprobante')
    `, [config.database]);

    const tableList = tables as any[];
    log('DB', `Tablas encontradas: ${tableList.length}`, 'cyan');
    tableList.forEach(t => log('TABLE', `  ✓ ${t.TABLE_NAME}`, 'blue'));

    // Verificar tablas faltantes
    const requiredTables = ['app_qr_bienes', 'users', 'app_ubicaciones', 'roles', 'model_has_roles'];
    const foundTables = tableList.map(t => t.TABLE_NAME);
    const missingTables = requiredTables.filter(t => !foundTables.includes(t));

    if (missingTables.length > 0) {
      missingTables.forEach(t => log('TABLE', `  ✗ ${t} (FALTANTE)`, 'red'));
    }

    console.log('');

    // Contar registros
    log('DATA', 'Contando registros...', 'cyan');

    try {
      const [bienesCount] = await connection.query('SELECT COUNT(*) as total FROM app_qr_bienes');
      log('COUNT', `app_qr_bienes: ${(bienesCount as any)[0].total} registros`, 'green');
    } catch (e) {
      log('COUNT', 'app_qr_bienes: Error al contar', 'red');
    }

    try {
      const [usersCount] = await connection.query('SELECT COUNT(*) as total FROM users WHERE estado = 1');
      log('COUNT', `users activos: ${(usersCount as any)[0].total} registros`, 'green');
    } catch (e) {
      log('COUNT', 'users: Error al contar', 'red');
    }

    try {
      const [ubicacionesCount] = await connection.query('SELECT COUNT(*) as total FROM app_ubicaciones');
      log('COUNT', `app_ubicaciones: ${(ubicacionesCount as any)[0].total} registros`, 'green');
    } catch (e) {
      log('COUNT', 'app_ubicaciones: Error al contar', 'red');
    }

    console.log('');
    log('RESULT', '✅ BASE DE DATOS CONECTADA Y FUNCIONANDO', 'green');

    await connection.end();
    return true;

  } catch (error: any) {
    log('ERROR', `❌ Error de conexión: ${error.message}`, 'red');
    if (error.code === 'ECONNREFUSED') {
      log('ERROR', 'El servidor MySQL no está corriendo o no es accesible', 'yellow');
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      log('ERROR', 'Usuario o contraseña incorrectos', 'yellow');
    }
    if (error.code === 'ER_BAD_DB_ERROR') {
      log('ERROR', `La base de datos '${config.database}' no existe`, 'yellow');
    }

    if (connection) await connection.end();
    return false;
  }
}

testConnection().then(success => {
  console.log('\n========================================');
  console.log(success ? '✅ PRUEBAS COMPLETADAS' : '❌ PRUEBAS FALLIDAS');
  console.log('========================================\n');
  process.exit(success ? 0 : 1);
});
