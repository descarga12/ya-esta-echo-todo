const mysql = require('mysql2/promise');

async function insertSampleData() {
  console.log('=== Insertando datos de prueba en pat_bien ===\n');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'prueba'
  });
  
  const sampleBienes = [
    {
      codbien: 'BIEN001',
      descbien: 'Laptop Dell Latitude 5430',
      ubicacion: 'Oficina Principal',
      duniorqa: 'UNIDAD01',
      estadobien: 'A',
      idpatusu: 'admin',
      marca: 'Dell',
      modelo: 'Latitude 5430',
      tpbien: 'EQUIPOS'
    },
    {
      codbien: 'BIEN002',
      descbien: 'Monitor Samsung 24 pulgadas',
      ubicacion: 'Oficina Principal',
      duniorqa: 'UNIDAD01',
      estadobien: 'A',
      idpatusu: 'admin',
      marca: 'Samsung',
      modelo: 'S24F350',
      tpbien: 'EQUIPOS'
    },
    {
      codbien: 'BIEN003',
      descbien: 'Impresora HP LaserJet Pro',
      ubicacion: 'Sala de Reuniones',
      duniorqa: 'UNIDAD02',
      estadobien: 'A',
      idpatusu: 'admin',
      marca: 'HP',
      modelo: 'M404dn',
      tpbien: 'EQUIPOS'
    },
    {
      codbien: 'BIEN004',
      descbien: 'Escritorio de madera',
      ubicacion: 'Oficina Principal',
      duniorqa: 'UNIDAD01',
      estadobien: 'A',
      idpatusu: 'admin',
      marca: 'Muebles SA',
      modelo: 'Standard',
      tpbien: 'MUEBLES'
    },
    {
      codbien: 'BIEN005',
      descbien: 'Silla ergonómica',
      ubicacion: 'Oficina Principal',
      duniorqa: 'UNIDAD01',
      estadobien: 'A',
      idpatusu: 'admin',
      marca: 'Herman Miller',
      modelo: 'Aeron',
      tpbien: 'MUEBLES'
    }
  ];
  
  try {
    const connection = await pool.getConnection();
    
    // Limpiar datos existentes (opcional - quitar si no quieres borrar)
    // await connection.query('DELETE FROM pat_bien');
    
    for (const bien of sampleBienes) {
      try {
        await connection.query(
          `INSERT INTO pat_bien (codbien, descbien, ubicacion, duniorqa, estadobien, idpatusu, marca, modelo, tpbien) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [bien.codbien, bien.descbien, bien.ubicacion, bien.duniorqa, bien.estadobien, 
           bien.idpatusu, bien.marca, bien.modelo, bien.tpbien]
        );
        console.log(`✅ Insertado: ${bien.codbien} - ${bien.descbien}`);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Ya existe: ${bien.codbien}`);
        } else {
          console.log(`❌ Error en ${bien.codbien}: ${e.message}`);
        }
      }
    }
    
    // Verificar total
    const [result] = await connection.query('SELECT COUNT(*) as total FROM pat_bien');
    console.log(`\n📊 Total de bienes en la tabla: ${result[0].total}`);
    
    connection.release();
    console.log('\n✅ Datos insertados exitosamente');
    console.log('🔄 Recarga la página del APK para ver los bienes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

insertSampleData();
