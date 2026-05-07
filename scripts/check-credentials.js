import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkUserCredentials() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'prueba',
  };

  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa.');

    const [rows] = await connection.query('SELECT name, password, estado FROM `users` LIMIT 5');
    console.log('--- Muestra de usuarios y contraseñas ---');
    console.table(rows);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkUserCredentials();
