import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== DIAGNÓSTICO DE BASE DE DATOS ===');
console.log('Configuración:');
console.log('  Host:', process.env.DB_HOST || 'localhost');
console.log('  Port:', process.env.DB_PORT || 3306);
console.log('  User:', process.env.DB_USER || 'root');
console.log('  Database:', process.env.DB_NAME || 'prueba');
console.log('  Password:', process.env.DB_PASS ? '***configurada***' : 'vacía');
console.log('');

async function testConnection() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'prueba',
    });

    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a MySQL');
    
    // Check tables
    const [rows] = await connection.query('SHOW TABLES');
    console.log('');
    console.log('Tablas existentes:');
    if (rows.length === 0) {
      console.log('  (ninguna tabla)');
    } else {
      rows.forEach(row => {
        const tableName = Object.values(row)[0];
        console.log('  -', tableName);
      });
    }
    
    connection.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('Posibles causas:');
      console.log('  - MySQL/Laragon no está corriendo');
      console.log('  - El puerto 3306 está bloqueado');
      console.log('  - Las credenciales son incorrectas');
    }
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('');
      console.log('La base de datos "prueba" no existe. Crea la base de datos primero.');
    }
  }
}

testConnection();
