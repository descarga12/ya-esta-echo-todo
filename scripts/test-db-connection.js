import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'prueba',
  };

  console.log('=== PRUEBA DE CONEXIÓN A BASE DE DATOS ===');
  console.log('Host:', dbConfig.host);
  console.log('User:', dbConfig.user);
  console.log('Database:', dbConfig.database);
  console.log('');

  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa a la base de datos.');

    const tablesToCheck = ['app_usuarios', 'app_qr_bienes', 'app_ubicaciones', 'alm_producto'];
    
    console.log('\n--- Verificando Tablas ---');
    for (const table of tablesToCheck) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``);
        console.log(`✅ Tabla '${table}': ${rows[0].count} registros encontrados.`);
      } catch (tableError) {
        console.log(`❌ Tabla '${table}': No encontrada o inaccesible.`);
      }
    }

    console.log('\n✨ Prueba finalizada con éxito.');
  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Sugerencia: Asegúrate de que MySQL esté corriendo en el puerto 3306.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('Sugerencia: Verifica que el usuario y la contraseña sean correctos.');
    }
  } finally {
    if (connection) await connection.end();
  }
}

testConnection();
