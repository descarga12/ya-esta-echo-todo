const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('=== Test de Conexión a Base de Datos ===\n');
  
  // Leer variables de entorno
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'prueba'
  };
  
  console.log('Configuración:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  Password: ${config.password ? '***' : '(vacío)'}\n`);
  
  try {
    const pool = mysql.createPool(config);
    const connection = await pool.getConnection();
    
    console.log('✅ Conexión EXITOSA a MySQL\n');
    
    // Verificar tablas
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📋 Tablas encontradas: ${tables.length}`);
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`   - ${tableName}`);
    });
    
    // Verificar si pat_bien tiene datos
    try {
      const [bienes] = await connection.query('SELECT COUNT(*) as total FROM pat_bien');
      console.log(`\n📦 Tabla pat_bien: ${bienes[0].total} registros`);
    } catch (e) {
      console.log(`\n❌ Error al consultar pat_bien: ${e.message}`);
    }
    
    // Verificar pat_usu
    try {
      const [usuarios] = await connection.query('SELECT COUNT(*) as total FROM pat_usu');
      console.log(`👤 Tabla pat_usu: ${usuarios[0].total} registros`);
    } catch (e) {
      console.log(`❌ Error al consultar pat_usu: ${e.message}`);
    }
    
    connection.release();
    console.log('\n✅ Test completado');
    
  } catch (error) {
    console.error('\n❌ ERROR de conexión:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Soluciones posibles:');
    console.error('   1. Verifica que MySQL esté corriendo');
    console.error('   2. Verifica las credenciales en el archivo .env');
    console.error('   3. Verifica que la base de datos "prueba" exista');
  }
}

testConnection();
