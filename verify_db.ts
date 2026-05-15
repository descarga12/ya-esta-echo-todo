import pool from "./server/lib/db.js";

async function verifyDatabase() {
  console.log("--- VERIFICANDO BASE DE DATOS ---");
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("Ô£ô Conexi├│n exitosa al pool.");

    const [tables]: any = await connection.query("SHOW TABLES");
    const tableNames = tables.map((t: any) => Object.values(t)[0]);
    console.log(`Ô£ô Tablas encontradas (${tableNames.length}): ${tableNames.join(", ")}`);

    const criticalTables = ["app_qr_bienes", "app_usuarios", "pat_bien", "pat_usu", "alm_producto"];
    for (const table of criticalTables) {
      if (tableNames.includes(table)) {
        const [count]: any = await connection.query(`SELECT COUNT(*) as total FROM ${table}`);
        console.log(`  - [OK] ${table}: ${count[0].total} registros`);
      } else {
        console.warn(`  - [!] ADVERTENCIA: Tabla cr├¡tica '${table}' no encontrada.`);
      }
    }

    console.log("\n--- VERIFICANDO INTEGRIDAD DE RELACIONES (BIENES) ---");
    // Verificar si hay bienes sin usuario asignado (si aplica)
    const [orphans]: any = await connection.query(`
      SELECT COUNT(*) as total FROM pat_bien p 
      LEFT JOIN pat_usu u ON p.idpatusu = u.id 
      WHERE p.idpatusu IS NOT NULL AND u.id IS NULL
    `);
    console.log(`- Bienes con ID de usuario inv├ílido: ${orphans[0].total}`);

  } catch (err: any) {
    console.error("Ô£û ERROR DE BASE DE DATOS:", err.message);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

verifyDatabase();
