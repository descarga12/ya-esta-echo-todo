import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkRolesTable() {
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

    const [rowsRoles] = await connection.query('DESCRIBE `roles`');
    console.log('--- Estructura de la tabla `roles` ---');
    console.table(rowsRoles);

    const [rowsModelHasRoles] = await connection.query('DESCRIBE `model_has_roles`');
    console.log('--- Estructura de la tabla `model_has_roles` ---');
    console.table(rowsModelHasRoles);

    const [roles] = await connection.query('SELECT * FROM `roles`');
    console.log('--- Roles disponibles ---');
    console.table(roles);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkRolesTable();
