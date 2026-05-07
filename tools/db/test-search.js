const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('--- TEST 1: Buscar "admin" (Usuarios) ---');
    const q1 = '%admin%';
    const [usuarios] = await conn.query(
      "SELECT id, nombre, username, cargo FROM pat_usu WHERE nombre LIKE ? OR username LIKE ? OR cargo LIKE ? LIMIT 5",
      [q1, q1, q1]
    );
    console.log(JSON.stringify(usuarios, null, 2));

    console.log('\n--- TEST 2: Buscar "Almacén" (Ubicaciones) ---');
    const q2 = '%Almacén%';
    const [ubicaciones] = await conn.query(
      "SELECT id, nombre_departamento FROM qr_bienes WHERE nombre_departamento LIKE ? LIMIT 5",
      [q2]
    );
    console.log(JSON.stringify(ubicaciones, null, 2));

    console.log('\n--- TEST 3: Buscar en todas las tablas (Simulando handleGlobalSearch) ---');
    const q3 = '%admin%';
    const query = `%${q3}%`;
    const results = [];

    // Pat Bien
    const [bienes] = await conn.query("SELECT id, nombre FROM pat_bien WHERE nombre LIKE ? OR sku LIKE ? LIMIT 5", [query, query]);
    bienes.forEach(b => results.push({ table: 'pat_bien', id: b.id, title: b.nombre }));

    // Pat Usu
    const [us] = await conn.query("SELECT id, nombre FROM pat_usu WHERE nombre LIKE ? OR username LIKE ? LIMIT 5", [query, query]);
    us.forEach(u => results.push({ table: 'pat_usu', id: u.id, title: u.nombre }));

    console.log('Resultados combinados:', JSON.stringify(results, null, 2));

    await conn.end();
  } catch (err) {
    console.error('ERROR EN TEST:', err);
  }
}

main();
