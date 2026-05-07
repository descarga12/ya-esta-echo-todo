import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listTables() {
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
    const [rows] = await connection.query('SHOW TABLES');
    console.log(rows.map(row => Object.values(row)[0]));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

listTables();
