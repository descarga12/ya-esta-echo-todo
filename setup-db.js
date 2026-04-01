import mysql from 'mysql2/promise';

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prueba'
  });

  try {
    // Crear tabla usuarios si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        unidad_organica VARCHAR(100),
        cargo VARCHAR(100),
        rol VARCHAR(50) DEFAULT 'Registrador',
        estado INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla usuarios lista');

    // Verificar si existe usuario admin
    const [users] = await connection.execute(
      'SELECT id FROM usuarios WHERE username = ?',
      ['admin']
    );

    if (users.length === 0) {
      // Insertar usuario admin
      await connection.execute(
        'INSERT INTO usuarios (username, password, nombre, unidad_organica, cargo, rol, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['admin', '123456', 'Administrador', 'Administración', 'Administrador', 'Administrador', 1]
      );
      console.log('✅ Usuario admin creado: admin / 123456');
    } else {
      console.log('✅ Usuario admin ya existe');
    }

    // Listar usuarios
    const [allUsers] = await connection.execute(
      'SELECT id, username, nombre, unidad_organica, cargo, rol FROM usuarios WHERE estado = 1'
    );
    console.log('\n📋 Usuarios activos en BD:');
    console.table(allUsers);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.end();
  }
}

setupDatabase();
