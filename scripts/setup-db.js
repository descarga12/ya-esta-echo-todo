import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function setupDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  };

  const dbName = process.env.DB_NAME || 'prueba';

  console.log('=== CONFIGURACIÓN DE BASE DE DATOS (Beneficencia) ===');
  console.log(`Host: ${dbConfig.host}`);
  console.log(`Base de datos: ${dbName}`);
  console.log('');

  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log(`✅ Conexión inicial exitosa.`);
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Base de datos '${dbName}' asegurada.`);
    
    await connection.query(`USE \`${dbName}\``);

    // 1. Ubicaciones / Departamentos (app_ubicaciones)
    console.log('Creando tabla \'app_ubicaciones\'...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`app_ubicaciones\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nombre_departamento\` VARCHAR(255) NOT NULL,
        \`codigo_qr_zona\` VARCHAR(255) UNIQUE,
        \`descripcion\` TEXT,
        \`estado\` TINYINT DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 2. Inventario QR (app_qr_bienes)
    console.log('Creando tabla \'app_qr_bienes\'...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`app_qr_bienes\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`sku\` VARCHAR(100) NOT NULL UNIQUE,
        \`cantidad\` INT DEFAULT 0,
        \`ubicacion\` VARCHAR(255),
        \`foto\` VARCHAR(500),
        \`qr_code\` TEXT,
        \`registrado_por\` VARCHAR(100),
        \`registrado_nombre\` VARCHAR(255),
        \`registrado_unidad\` VARCHAR(255),
        \`registrado_cargo\` VARCHAR(255),
        \`fecha_registro\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`fecha_actualizacion\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sku (\`sku\`),
        INDEX idx_nombre (\`nombre\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. Usuarios de la App (app_usuarios)
    console.log('Creando tabla \'app_usuarios\'...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`app_usuarios\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`username\` VARCHAR(50) NOT NULL UNIQUE,
        \`password\` VARCHAR(255) NOT NULL,
        \`nombre\` VARCHAR(100) NOT NULL,
        \`rol\` ENUM('admin', 'registrar', 'viewer') DEFAULT 'registrar',
        \`cargo\` VARCHAR(100),
        \`unidad_organica\` VARCHAR(100),
        \`estado\` TINYINT DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('\nInsertando datos iniciales...');

    // Inserción de departamentos iniciales
    let idDepartamento = 1;
    const [depExists] = await connection.query('SELECT id FROM app_ubicaciones LIMIT 1');
    if (depExists.length === 0) {
      console.log('Insertando departamentos iniciales...');
      const [result] = await connection.query('INSERT INTO app_ubicaciones (nombre_departamento, codigo_qr_zona) VALUES (?, ?)', ['Almacén Central', 'QR-ALM-001']);
      idDepartamento = result.insertId;
      await connection.query('INSERT INTO app_ubicaciones (nombre_departamento, codigo_qr_zona) VALUES (?, ?)', ['Oficina Administrativa', 'QR-ADM-001']);
    } else {
      idDepartamento = depExists[0].id;
    }

    // Inserción de usuarios iniciales (app_usuarios)
    const [adminExists] = await connection.query('SELECT id FROM app_usuarios WHERE username = ?', ['admin']);
    if (adminExists.length === 0) {
      console.log('Insertando usuarios iniciales...');
      // Admin principal
      await connection.query(
        'INSERT INTO app_usuarios (username, password, nombre, rol, unidad_organica, cargo) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin', '123456', 'Administrador General', 'admin', 'Sistemas', 'Jefe de TI']
      );
      // Registrador 1
      await connection.query(
        'INSERT INTO app_usuarios (username, password, nombre, rol, unidad_organica, cargo) VALUES (?, ?, ?, ?, ?, ?)',
        ['juan.perez', '123456', 'Juan Pérez', 'registrar', 'Logística', 'Auxiliar']
      );
    }

    // Inserción de bienes iniciales (app_qr_bienes)
    const [qrBienesExists] = await connection.query('SELECT id FROM app_qr_bienes LIMIT 1');
    if (qrBienesExists.length === 0) {
      console.log('Insertando lista MASIVA de bienes en app_qr_bienes...');
      const bienes = [
        ['Escritorio de Madera Roble', 'ESC-001', 5, 'Almacén Central'],
        ['Impresora HP LaserJet Pro', 'IMP-001', 2, 'Oficina Administrativa'],
        ['Silla Giratoria Ergonómica', 'SIL-001', 12, 'Almacén Central'],
        ['Computadora Core i5 12th Gen', 'CPU-001', 8, 'Oficina Administrativa'],
        ['Monitor LED 24" Full HD', 'MON-001', 10, 'Almacén Central'],
        ['Armario de Metal Reforzado', 'ARM-001', 4, 'Oficina Administrativa'],
        ['Ventilador de Torre Silencioso', 'VEN-001', 3, 'Almacén Central'],
        ['Proyector Epson 4K', 'PRO-001', 1, 'Oficina Administrativa'],
        ['Estante para Libros Metálico', 'EST-001', 6, 'Almacén Central'],
        ['Mesa de Reuniones Ovalada', 'MES-001', 1, 'Oficina Administrativa'],
        ['Laptop Dell Latitude 5420', 'LAP-001', 15, 'Sistemas'],
        ['Teclado Mecánico RGB', 'TEC-001', 20, 'Sistemas'],
        ['Mouse Óptico Inalámbrico', 'MOU-001', 25, 'Sistemas'],
        ['Router Cisco Industrial', 'ROU-001', 2, 'Sistemas'],
        ['Servidor NAS 12TB', 'NAS-001', 1, 'Sistemas'],
        ['Cámara de Seguridad IP', 'CAM-001', 10, 'Vigilancia'],
        ['Extintor de Incendios PQS', 'EXT-001', 12, 'Seguridad'],
        ['Botiquín de Primeros Auxilios', 'BOT-001', 5, 'Enfermería'],
        ['Camilla de Examen Médico', 'CAM-002', 2, 'Enfermería'],
        ['Escritorio de Recepción', 'ESC-002', 1, 'Mesa de Partes']
      ];

      for (const [nombre, sku, cantidad, ubicacion] of bienes) {
        await connection.query(
          'INSERT INTO app_qr_bienes (id, nombre, sku, cantidad, ubicacion, registrado_por, registrado_nombre, registrado_unidad, registrado_cargo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
          [crypto.randomUUID(), nombre, sku, cantidad, ubicacion, '1', 'Administrador General', 'Sistemas', 'Jefe de TI']
        );
      }
    }

    console.log('\n✨ Configuración de base de datos refinada con éxito.');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

setupDatabase();
