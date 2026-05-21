import pool from "../server/lib/db.js";

async function verifyDatabase() {
  console.log("--- VERIFICANDO BASE DE DATOS ---");
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("✔ Conexión exitosa al pool.");

    const [tables]: any = await connection.query("SHOW TABLES");
    const tableNames = tables.map((t: any) => Object.values(t)[0]);
    console.log(`✔ Tablas encontradas (${tableNames.length}): ${tableNames.join(", ")}`);

    // Tablas críticas reales del sistema PAT y Almacén
    const criticalTables = [
      "pat_bien", 
      "pat_usu", 
      "tes_unidad_organica", 
      "pre_unid_med_ptrabajo"
    ];

    for (const table of criticalTables) {
      if (tableNames.includes(table)) {
        const [count]: any = await connection.query(`SELECT COUNT(*) as total FROM \`${table}\``);
        console.log(`  - [OK] ${table}: ${count[0].total} registros`);
      } else {
        console.warn(`  - [!] ADVERTENCIA: Tabla crítica '${table}' no encontrada.`);
      }
    }

    console.log("\n--- VERIFICANDO INTEGRIDAD DE RELACIONES (BIENES) ---");
    // Verificar si hay bienes sin usuario asignado que deberían tener uno
    const [orphans]: any = await connection.query(`
      SELECT COUNT(*) as total FROM pat_bien p 
      LEFT JOIN pat_usu u ON p.idpatusu = u.id 
      WHERE p.idpatusu IS NOT NULL AND u.id IS NULL
    `);
    console.log(`- Bienes con ID de usuario inválido: ${orphans[0].total}`);

  } catch (err: any) {
    console.error("✘ ERROR DE BASE DE DATOS:", err.message);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

verifyDatabase();
