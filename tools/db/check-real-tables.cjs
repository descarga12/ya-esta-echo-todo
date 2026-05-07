/**
 * Script para verificar las tablas reales del sistema PAT
 * Ejecutar: node check-real-tables.cjs
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

async function checkTables() {
  console.log('\n========================================');
  console.log('  TABLAS DEL SISTEMA PAT');
  console.log('========================================\n');

  const config = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: ''
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    await connection.query('USE prueba');
    
    // Lista de tablas que mencionaste
    const tablasInteres = [
      'pat_bien',
      'pat_detabaja',
      'pat_usu',
      'tes_unidad_organica',
      'users'
    ];
    
    log('INFO', 'Buscando tablas del sistema PAT...', 'blue');
    
    for (const tabla of tablasInteres) {
      const [exists] = await connection.query(`SHOW TABLES LIKE '${tabla}'`);
      
      if (exists.length > 0) {
        log('OK', `Tabla ${tabla} existe`, 'green');
        
        // Mostrar estructura
        const [columns] = await connection.query(`DESCRIBE ${tabla}`);
        console.log(`\n  Estructura de ${tabla}:`);
        console.log('  ' + '-'.repeat(50));
        
        columns.forEach(col => {
          const pk = col.Key === 'PRI' ? ' [PK]' : '';
          const nullable = col.Null === 'YES' ? ' NULL' : ' NOT NULL';
          console.log(`    ${col.Field.padEnd(25)} ${col.Type.padEnd(15)}${pk}${nullable}`);
        });
        
        // Contar registros
        const [count] = await connection.query(`SELECT COUNT(*) as n FROM ${tabla}`);
        console.log(`\n  Total registros: ${count[0].n}\n`);
        
      } else {
        log('WARN', `Tabla ${tabla} NO existe`, 'yellow');
      }
    }
    
    // Ver todas las tablas que empiezan con pat_
    log('INFO', '\nTodas las tablas que empiezan con "pat_":', 'cyan');
    const [patTables] = await connection.query("SHOW TABLES LIKE 'pat_%'");
    patTables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`  - ${tableName}`);
    });
    
    // Ver todas las tablas que empiezan con tes_
    log('INFO', '\nTodas las tablas que empiezan con "tes_":', 'cyan');
    const [tesTables] = await connection.query("SHOW TABLES LIKE 'tes_%'");
    tesTables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`  - ${tableName}`);
    });

    await connection.end();
    
    console.log('\n========================================');
    console.log('  Ahora puedo actualizar las rutas de la API');
    console.log('  para usar las tablas correctas.');
    console.log('========================================\n');

  } catch (err) {
    log('ERROR', err.message, 'red');
    if (err.code === 'ECONNREFUSED') {
      log('TIP', 'MySQL no esta corriendo. Inicia Laragon.', 'yellow');
    }
    if (connection) await connection.end();
  }
}

checkTables();
