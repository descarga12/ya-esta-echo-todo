/**
 * Script simple para verificar conexión a MySQL
 * Ejecutar con: node verify-connection.js
 */
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: ''
});

console.log('🔌 Intentando conectar a MySQL...\n');

connection.connect((err) => {
  if (err) {
    console.error('❌ Error de conexión:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Verifica que:');
      console.log('   1. Laragon está iniciado');
      console.log('   2. El servicio MySQL está corriendo');
      console.log('   3. El puerto 3306 está disponible');
    }
    process.exit(1);
  }

  console.log('✅ Conexión exitosa a MySQL!');

  // Verificar base de datos 'prueba'
  connection.query("SHOW DATABASES LIKE 'prueba'", (err, results) => {
    if (err) {
      console.error('❌ Error:', err.message);
      connection.end();
      process.exit(1);
    }

    if (results.length === 0) {
      console.log('⚠️  La base de datos "prueba" NO existe');
      console.log('   Creándola...');

      connection.query('CREATE DATABASE prueba', (err) => {
        if (err) {
          console.error('❌ Error al crear base de datos:', err.message);
          connection.end();
          process.exit(1);
        }
        console.log('✅ Base de datos "prueba" creada');
        checkTables();
      });
    } else {
      console.log('✅ Base de datos "prueba" existe');
      checkTables();
    }
  });
});

function checkTables() {
  connection.query('USE prueba', (err) => {
    if (err) {
      console.error('❌ Error al usar prueba:', err.message);
      connection.end();
      process.exit(1);
    }

    connection.query('SHOW TABLES', (err, tables) => {
      if (err) {
        console.error('❌ Error:', err.message);
        connection.end();
        process.exit(1);
      }

      console.log('\n📋 Tablas encontradas:', tables.length);
      tables.forEach(t => {
        const tableName = Object.values(t)[0];
        console.log('   • ' + tableName);
      });

      // Verificar tablas necesarias
      const required = ['app_qr_bienes', 'users', 'app_ubicaciones'];
      const found = tables.map(t => Object.values(t)[0]);
      const missing = required.filter(r => !found.includes(r));

      if (missing.length > 0) {
        console.log('\n⚠️  Tablas faltantes:', missing.join(', '));
        console.log('   Importa el archivo prueba.sql a la base de datos');
      } else {
        console.log('\n✅ Todas las tablas principales existen');
      }

      console.log('\n✅ Configuración completa!');
      connection.end();
      process.exit(0);
    });
  });
}
