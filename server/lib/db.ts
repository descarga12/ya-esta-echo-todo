import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Carga variables de entorno para usar las credenciales de BD
// desde .env sin hardcodear valores sensibles.
dotenv.config();

// Pool compartido de conexiones:
// - evita abrir/cerrar conexiones por cada request
// - mejora rendimiento bajo carga
// - permite que las rutas pidan/reusen conexiones de forma segura
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "prueba",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Se exporta una única instancia para todo el backend.
export default pool;

// Verificar conexión al inicio (solo en logs)
pool.getConnection()
  .then(conn => {
    console.log(`✅ Conectado a la base de datos MySQL en ${process.env.DB_HOST || 'localhost'}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  });
