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
    await connection.query('DROP TABLE IF EXISTS `usuarios`');
    
    // Create table
    const sql = `
      CREATE TABLE \`usuarios\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`username\` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL UNIQUE,
        \`password\` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        \`nombre\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`unidad_organica\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`cargo\` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
        \`rol\` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'registrar',
        \`estado\` int NOT NULL DEFAULT 1,
        \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`) USING BTREE,
        UNIQUE KEY \`uk_username\` (\`username\`)
      ) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic
    `;
    
    await connection.query(sql);
    console.log('✓ Tabla usuarios creada correctamente');
    
    // Insert default users
    await connection.query(
      'INSERT INTO usuarios (username, password, nombre, unidad_organica, cargo, rol, estado) VALUES (?, ?, ?, ?, ?, ?, 1)',
      ['admin', 'admin123', 'Administrador', 'Administración', 'Gerente', 'admin']
    );
    
    await connection.query(
      'INSERT INTO usuarios (username, password, nombre, unidad_organica, cargo, rol, estado) VALUES (?, ?, ?, ?, ?, ?, 1)',
      ['registrador1', 'pass123', 'Juan Pérez', 'Almacén', 'Registrador', 'registrar']
    );
    
    console.log('✓ Usuarios de prueba insertados');
    console.log('  - admin / admin123 (Administrador)');
    console.log('  - registrador1 / pass123 (Registrador)');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

createTable().catch(console.error);
