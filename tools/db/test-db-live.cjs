/**
 * Pruebas en vivo - Solo Base de Datos (CommonJS)
 * Ejecutar: node test-db-live.cjs
 */
const mysql = require('mysql2/promise');

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

async function runTests() {
  console.log('\n========================================');
  console.log('  PRUEBAS EN VIVO - BASE DE DATOS');
  console.log('========================================\n');

  // Test 1: Conexión
  log('TEST', '1. Probando conexión MySQL...', 'cyan');
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    });
    
    await connection.ping();
    log('DB', '✅ Conexión MySQL exitosa', 'green');
    
    // Versión
    const [version] = await connection.query('SELECT VERSION() as v');
    log('DB', `Versión: ${version[0].v}`, 'blue');
    
  } catch (err) {
    log('DB', `❌ Error: ${err.message}`, 'red');
    if (err.code === 'ECONNREFUSED') {
      log('HINT', '💡 Asegúrate de que Laragon/MySQL esté corriendo en el puerto 3306', 'yellow');
      log('HINT', '   - Abre Laragon y verifica que el servicio MySQL esté iniciado', 'yellow');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      log('HINT', '💡 Verifica el usuario y password de MySQL', 'yellow');
    }
    process.exit(1);
  }

  // Test 2: Base de datos prueba
  console.log('');
  log('TEST', '2. Verificando base de datos "prueba"...', 'cyan');
  
  try {
    const [dbs] = await connection.query("SHOW DATABASES LIKE 'prueba'");
    if (dbs.length > 0) {
      log('DB', '✅ Base de datos "prueba" existe', 'green');
      await connection.query('USE prueba');
    } else {
      log('DB', '❌ Base de datos "prueba" NO existe', 'red');
      log('HINT', '   Crea la base de datos o importa prueba.sql', 'yellow');
      await connection.end();
      process.exit(1);
    }
  } catch (err) {
    log('DB', `❌ Error: ${err.message}`, 'red');
    await connection.end();
    process.exit(1);
  }

  // Test 3: Tablas
  console.log('');
  log('TEST', '3. Verificando tablas necesarias...', 'cyan');
  
  const requiredTables = [
    { name: 'app_qr_bienes', important: true },
    { name: 'users', important: true },
    { name: 'app_ubicaciones', important: true },
    { name: 'roles', important: true },
    { name: 'model_has_roles', important: false },
    { name: 'categoria', important: false },
    { name: 'comprobante', important: false },
    { name: 'ingreso', important: false }
  ];
  
  const [tables] = await connection.query('SHOW TABLES');
  const existingTables = tables.map(t => Object.values(t)[0]);
  
  log('DB', `Tablas encontradas: ${existingTables.length}`, 'blue');
  
  let missingImportant = 0;
  for (const table of requiredTables) {
    const exists = existingTables.includes(table.name);
    if (exists) {
      log('TABLE', `✅ ${table.name}`, 'green');
    } else {
      if (table.important) {
        log('TABLE', `❌ ${table.name} (IMPORTANTE)`, 'red');
        missingImportant++;
      } else {
        log('TABLE', `⚠️ ${table.name} (opcional)`, 'yellow');
      }
    }
  }

  // Test 4: Datos
  console.log('');
  log('TEST', '4. Contando registros...', 'cyan');
  
  try {
    const [bienes] = await connection.query('SELECT COUNT(*) as n FROM app_qr_bienes');
    log('COUNT', `app_qr_bienes: ${bienes[0].n} registros`, 'blue');
  } catch (e) {
    log('COUNT', 'app_qr_bienes: Error', 'red');
  }
  
  try {
    const [users] = await connection.query('SELECT COUNT(*) as n FROM users WHERE estado=1');
    log('COUNT', `users activos: ${users[0].n} registros`, 'blue');
  } catch (e) {
    log('COUNT', 'users: Error', 'red');
  }
  
  try {
    const [ubicaciones] = await connection.query('SELECT COUNT(*) as n FROM app_ubicaciones');
    log('COUNT', `app_ubicaciones: ${ubicaciones[0].n} registros`, 'blue');
  } catch (e) {
    log('COUNT', 'app_ubicaciones: Error', 'red');
  }

  // Test 5: Estructura de tabla app_qr_bienes
  console.log('');
  log('TEST', '5. Verificando estructura de app_qr_bienes...', 'cyan');
  
  try {
    const [columns] = await connection.query('DESCRIBE app_qr_bienes');
    const columnNames = columns.map(c => c.Field);
    log('STRUCT', `Columnas: ${columnNames.join(', ')}`, 'blue');
    
    const expected = ['id', 'nombre', 'sku', 'cantidad', 'ubicacion', 'foto', 'qr_code', 'registrado_por'];
    const hasAll = expected.every(col => columnNames.includes(col));
    if (hasAll) {
      log('STRUCT', '✅ Todas las columnas esperadas existen', 'green');
    } else {
      log('STRUCT', '⚠️ Faltan algunas columnas', 'yellow');
    }
  } catch (e) {
    log('STRUCT', `❌ Error: ${e.message}`, 'red');
  }

  await connection.end();

  // Resumen
  console.log('');
  console.log('========================================');
  if (missingImportant === 0) {
    log('RESULT', '✅ BASE DE DATOS OK - Todo listo', 'green');
  } else {
    log('RESULT', `⚠️ Faltan ${missingImportant} tablas importantes`, 'yellow');
  }
  console.log('========================================\n');
  
  process.exit(missingImportant > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
