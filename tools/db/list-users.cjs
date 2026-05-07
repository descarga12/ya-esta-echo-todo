/**
 * Lista todos los usuarios de pat_usu
 * Ejecutar: node list-users.cjs
 */
const mysql = require('mysql2/promise');

async function listUsers() {
  const config = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'prueba'
  };

  try {
    const connection = await mysql.createConnection(config);
    
    const [users] = await connection.query("SELECT * FROM pat_usu");
    
    console.log('\n========================================');
    console.log('  LISTA DE USUARIOS - pat_usu');
    console.log('========================================\n');
    console.log(`Total: ${users.length} usuarios\n`);
    
    users.forEach((user, i) => {
      console.log(`--- Usuario ${i + 1} ---`);
      Object.entries(user).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      console.log('');
    });
    
    await connection.end();
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listUsers();
