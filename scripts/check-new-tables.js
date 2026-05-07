import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkNewTables() {
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

    const tables = ['pat_bien', 'glob_detameta', 'tes_unidad_organica'];
    
    for (const table of tables) {
      console.log(`\n--- Estructura de la tabla \`${table}\` ---`);
      const [rows] = await connection.query(`DESCRIBE \`${table}\``);
      console.table(rows);
      
      const [count] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      console.log(`Registros encontrados: ${count[0].count}`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkNewTables();
