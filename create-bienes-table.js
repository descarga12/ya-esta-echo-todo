import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'prueba',
});

async function createTable() {
  const connection = await pool.getConnection();
  
  try {
    // Drop table if exists
    await connection.query('DROP TABLE IF EXISTS `qr_bienes`');
    
    // Create table
    const sql = `
      CREATE TABLE \`qr_bienes\` (
        \`id\` varchar(36) NOT NULL,
        \`nombre\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        \`sku\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
        \`cantidad\` int NOT NULL DEFAULT 0,
        \`ubicacion\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`foto\` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`qr_code\` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
        \`registrado_por\` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`registrado_nombre\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`registrado_unidad\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`registrado_cargo\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`fecha_registro\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`fecha_actualizacion\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`) USING BTREE,
        UNIQUE KEY \`uk_sku\` (\`sku\`)
      ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic
    `;
    
    await connection.query(sql);
    console.log('✓ Tabla qr_bienes creada correctamente');
    
    // Insert sample data
    await connection.query(
      'INSERT INTO qr_bienes (id, nombre, sku, cantidad, ubicacion, registrado_por, registrado_nombre, registrado_unidad, registrado_cargo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['1', 'Laptop Dell', 'LAP-DELL-001', 5, 'Almacén A', 'admin', 'Administrador', 'IT', 'Gerente']
    );
    
    await connection.query(
      'INSERT INTO qr_bienes (id, nombre, sku, cantidad, ubicacion, registrado_por, registrado_nombre, registrado_unidad, registrado_cargo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      ['2', 'Monitor 24 pulgadas', 'MON-24-002', 10, 'Almacén B', 'registrador1', 'Juan Pérez', 'Almacén', 'Registrador']
    );
    
    console.log('✓ Bienes de prueba insertados');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

createTable().catch(console.error);
