/**
 * Script para obtener datos del usuario admin
 * Ejecutar: node get-admin.cjs
 */
const mysql = require('mysql2/promise');

async function getAdmin() {
  const config = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'prueba'
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    
    // Ver columnas de la tabla
    const [columns] = await connection.query("DESCRIBE pat_usu");
    console.log('=== COLUMNAS EN pat_usu ===');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Buscar usuario que contenga "admin" en cualquier campo
    const columnNames = columns.map(c => c.Field);
    
    // Buscar en campos comunes de usuario
    const userFields = columnNames.filter(c => 
      c.toLowerCase().includes('usu') || 
      c.toLowerCase().includes('login') || 
      c.toLowerCase().includes('nombre') ||
      c.toLowerCase().includes('name')
    );
    
    console.log('\n=== BUSCANDO USUARIO ADMIN ===');
    
    // Intentar buscar en cada campo
    for (const field of userFields) {
      try {
        const [rows] = await connection.query(
          `SELECT * FROM pat_usu WHERE ${field} LIKE '%admin%' LIMIT 5`
        );
        if (rows.length > 0) {
          console.log(`\nEncontrado en campo "${field}":`);
          rows.forEach((row, i) => {
            console.log(`\n[Usuario ${i + 1}]`);
            Object.entries(row).forEach(([key, value]) => {
              console.log(`  ${key}: ${value}`);
            });
          });
        }
      } catch (e) {
        // Ignorar errores de búsqueda
      }
    }
    
    // Mostrar primeros 3 usuarios
    console.log('\n=== PRIMEROS 3 USUARIOS ===');
    const [allUsers] = await connection.query("SELECT * FROM pat_usu LIMIT 3");
    allUsers.forEach((user, i) => {
      console.log(`\n[Usuario ${i + 1}]`);
      Object.entries(user).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    });
    
    await connection.end();
    
  } catch (err) {
    console.error('Error:', err.message);
    if (connection) await connection.end();
  }
}

getAdmin();
