const mysql = require('mysql2/promise');
const http = require('http');

async function runDiagnostics() {
  console.log('=== DIAGNÓSTICO COMPLETO DEL SISTEMA ===\n');
  
  // 1. Verificar conexión a MySQL
  console.log('1️⃣  Verificando MySQL...');
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'prueba'
    });
    
    const connection = await pool.getConnection();
    const [result] = await connection.query('SELECT 1 as test');
    console.log('   ✅ MySQL conectado\n');
    
    // Verificar tablas PAT
    console.log('2️⃣  Verificando tablas PAT:');
    const tables = ['pat_bien', 'pat_usu', 'pat_detabaja', 'pre_unid_med_ptrabajo'];
    for (const table of tables) {
      try {
        const [rows] = await connection.query(`SELECT COUNT(*) as n FROM ${table}`);
        console.log(`   ✅ ${table}: ${rows[0].n} registros`);
      } catch (e) {
        console.log(`   ❌ ${table}: ${e.message}`);
      }
    }
    connection.release();
  } catch (error) {
    console.log('   ❌ ERROR MySQL:', error.message);
    console.log('   💡 Verifica que MySQL esté corriendo en Laragon/XAMPP');
  }
  
  // 2. Verificar servidor Node.js
  console.log('\n3️⃣  Verificando servidor Node.js...');
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/api/ping', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data }));
      });
      req.on('error', reject);
      req.setTimeout(3000, () => reject(new Error('Timeout')));
    });
    console.log('   ✅ Servidor Node.js corriendo (status:', response.status + ')');
  } catch (error) {
    console.log('   ❌ Servidor NO está corriendo');
    console.log('   💡 Ejecuta: npm run start');
  }
  
  console.log('\n=== FIN DEL DIAGNÓSTICO ===');
}

runDiagnostics();
