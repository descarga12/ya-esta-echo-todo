const mysql = require('mysql2/promise');

async function verifyData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'prueba'
  });
  
  try {
    const c = await pool.getConnection();
    
    console.log('=== VERIFICACIÓN DE DATOS ===\n');
    
    const [b] = await c.query('SELECT COUNT(*) as n FROM pat_bien');
    console.log('📦 pat_bien (Bienes): ' + b[0].n + ' registros');
    
    const [u] = await c.query('SELECT COUNT(*) as n FROM pat_usu');
    console.log('👤 pat_usu (Usuarios): ' + u[0].n + ' registros');
    
    const [un] = await c.query('SELECT COUNT(*) as n FROM pre_unid_med_ptrabajo');
    console.log('📋 pre_unid_med_ptrabajo (Unidades): ' + un[0].n + ' registros');
    
    const [ba] = await c.query('SELECT COUNT(*) as n FROM pat_detabaja');
    console.log('🗑️  pat_detabaja (Bajas): ' + ba[0].n + ' registros');
    
    console.log('\n✅ Verificación completada');
    c.release();
  } catch (e) {
    console.log('❌ Error: ' + e.message);
  }
  
  process.exit(0);
}

verifyData();
