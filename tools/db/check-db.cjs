/**
 * Script para verificar por qué no se muestran los objetos/bienes
 * Ejecutar: node check-db.cjs
 */
const mysql = require('mysql2/promise');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (label, msg, color = 'reset') => 
  console.log(`${colors[color]}[${label}]${colors.reset} ${msg}`);

async function checkDatabase() {
  console.log('\n========================================');
  console.log('  DIAGNOSTICO: Por que no se muestran los objetos?');
  console.log('========================================\n');

  const config = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: ''
  };

  let connection;
  
  try {
    // 1. Conectar a MySQL
    log('STEP', '1. Conectando a MySQL...', 'blue');
    connection = await mysql.createConnection(config);
    await connection.ping();
    log('OK', 'Conexion exitosa a MySQL', 'green');

    // 2. Verificar base de datos "prueba"
    log('STEP', '2. Verificando base de datos "prueba"...', 'blue');
    const [dbs] = await connection.query("SHOW DATABASES LIKE 'prueba'");
    if (dbs.length === 0) {
      log('ERROR', 'La base de datos "prueba" NO existe', 'red');
      log('TIP', 'Crea la base de datos: CREATE DATABASE prueba;', 'yellow');
      await connection.end();
      return;
    }
    log('OK', 'Base de datos "prueba" existe', 'green');

    // 3. Usar la base de datos
    await connection.query('USE prueba');

    // 4. Verificar tabla app_qr_bienes
    log('STEP', '3. Verificando tabla app_qr_bienes...', 'blue');
    const [tables] = await connection.query("SHOW TABLES LIKE 'app_qr_bienes'");
    if (tables.length === 0) {
      log('ERROR', 'La tabla app_qr_bienes NO existe', 'red');
      log('TIP', 'Importa el archivo prueba.sql:', 'yellow');
      log('TIP', 'mysql -u root prueba < prueba.sql', 'yellow');
      await connection.end();
      return;
    }
    log('OK', 'Tabla app_qr_bienes existe', 'green');

    // 5. Verificar estructura de la tabla
    log('STEP', '4. Verificando estructura de app_qr_bienes...', 'blue');
    const [columns] = await connection.query('DESCRIBE app_qr_bienes');
    log('INFO', `Columnas encontradas: ${columns.length}`, 'blue');
    columns.forEach(col => {
      console.log(`    - ${col.Field} (${col.Type})`);
    });

    // 6. Contar registros
    log('STEP', '5. Contando registros en app_qr_bienes...', 'blue');
    const [countResult] = await connection.query('SELECT COUNT(*) as total FROM app_qr_bienes');
    const total = countResult[0].total;
    
    if (total === 0) {
      log('WARN', 'La tabla app_qr_bienes esta VACIA (0 registros)', 'yellow');
      log('TIP', 'Necesitas insertar datos o importar el SQL', 'yellow');
    } else {
      log('OK', `Tabla tiene ${total} registros`, 'green');
    }

    // 7. Mostrar algunos registros si existen
    if (total > 0) {
      log('STEP', '6. Mostrando primeros 3 registros...', 'blue');
      const [rows] = await connection.query('SELECT * FROM app_qr_bienes LIMIT 3');
      rows.forEach((row, i) => {
        console.log(`\n  [Registro ${i + 1}]`);
        console.log(`    ID: ${row.id}`);
        console.log(`    Nombre: ${row.nombre}`);
        console.log(`    SKU: ${row.sku}`);
        console.log(`    Cantidad: ${row.cantidad}`);
      });
    }

    // 8. Verificar otras tablas necesarias
    log('STEP', '7. Verificando otras tablas necesarias...', 'blue');
    const requiredTables = ['users', 'app_ubicaciones', 'alm_producto', 'alm_categoria'];
    for (const table of requiredTables) {
      const [exists] = await connection.query(`SHOW TABLES LIKE '${table}'`);
      if (exists.length > 0) {
        const [count] = await connection.query(`SELECT COUNT(*) as n FROM ${table}`);
        log('OK', `${table}: ${count[0].n} registros`, 'green');
      } else {
        log('WARN', `${table}: No existe (opcional)`, 'yellow');
      }
    }

    await connection.end();

    // Resumen
    console.log('\n========================================');
    if (total === 0) {
      log('RESULT', 'PROBLEMA ENCONTRADO: La tabla app_qr_bienes esta vacia', 'red');
      console.log('');
      log('SOLUCION', 'Importa datos con:', 'yellow');
      console.log('  mysql -u root prueba < prueba.sql');
      console.log('');
      log('O inserta un registro de prueba:', 'yellow');
      console.log('  INSERT INTO app_qr_bienes (id, nombre, sku, cantidad) VALUES ("1", "Bien de prueba", "TEST001", 1);');
    } else {
      log('RESULT', 'TODO OK - La base de datos tiene datos', 'green');
      console.log('');
      log('TIP', 'Si la app no muestra objetos, revisa:', 'yellow');
      console.log('  1. Que el servidor este corriendo (pnpm dev)');
      console.log('  2. La consola del navegador (F12) para errores');
      console.log('  3. Que la URL de la API sea correcta');
    }
    console.log('========================================\n');

  } catch (err) {
    log('ERROR', err.message, 'red');
    if (err.code === 'ECONNREFUSED') {
      log('TIP', 'MySQL no esta corriendo. Inicia Laragon.', 'yellow');
    }
    if (connection) await connection.end();
  }
}

checkDatabase();
