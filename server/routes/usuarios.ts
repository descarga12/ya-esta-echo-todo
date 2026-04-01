import { RequestHandler } from "express";
import pool from "../lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface Usuario {
  id?: number;
  username: string;
  password?: string;
  nombre: string;
  unidad_organica: string;
  cargo: string;
  rol: string;
  estado?: number;
  created_at?: string;
  updated_at?: string;
}

// LOGIN usuario
export const loginUsuario: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Usuario y contraseña son requeridos" });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT id, username, nombre, unidad_organica, cargo, rol, estado FROM usuarios WHERE username = ? AND password = ? AND estado = 1",
      [username, password]
    );
    connection.release();

    if ((rows as any[]).length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = (rows as any[])[0];
    
    // Simular token JWT (en producción usar jwt library)
    const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString('base64');

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        unidad_organica: user.unidad_organica,
        cargo: user.cargo,
        rol: user.rol,
      },
    });
  } catch (error: any) {
    console.error("Error en loginUsuario:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET usuario actual
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No autorizado" });
    }

    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const connection = await pool.getConnection();
      const [rows] = await connection.query(
        "SELECT id, username, nombre, unidad_organica, cargo, rol FROM usuarios WHERE id = ? AND estado = 1",
        [decoded.id]
      );
      connection.release();

      if ((rows as any[]).length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json((rows as any[])[0]);
    } catch {
      return res.status(401).json({ error: "Token inválido" });
    }
  } catch (error: any) {
    console.error("Error en getCurrentUser:", error);
    res.status(500).json({ error: error.message });
  }
}

// GET all usuarios
export const listUsuarios: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Auto-create table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        unidad_organica VARCHAR(100),
        cargo VARCHAR(100),
        rol ENUM('admin', 'registrar', 'viewer') DEFAULT 'registrar',
        estado TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    
    // Insert default admin if table is empty
    const [count] = await connection.query("SELECT COUNT(*) as total FROM usuarios");
    if ((count as any[])[0].total === 0) {
      await connection.query(
        "INSERT INTO usuarios (username, password, nombre, unidad_organica, cargo, rol, estado) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ["admin", "admin", "Administrador", "Sistema", "Admin", "admin", 1]
      );
      console.log("[API] Default admin user created: admin/admin");
    }
    
    const [rows] = await connection.query(
      "SELECT id, username, nombre, unidad_organica, cargo, rol, estado, created_at FROM usuarios WHERE estado = 1"
    );
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error("Error en listUsuarios:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET single usuario by id
export const getUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT id, username, nombre, unidad_organica, cargo, rol, estado FROM usuarios WHERE id = ?",
      [id]
    );
    connection.release();

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json((rows as any[])[0]);
  } catch (error: any) {
    console.error("Error en getUsuario:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST create usuario
export const createUsuario: RequestHandler = async (req, res) => {
  try {
    const {
      username,
      password,
      nombre,
      unidad_organica,
      cargo,
      rol = "registrar",
    } = req.body;

    if (!username || !password || !nombre) {
      return res
        .status(400)
        .json({ error: "username, password y nombre son requeridos" });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO usuarios (username, password, nombre, unidad_organica, cargo, rol, estado) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [username, password, nombre, unidad_organica, cargo, rol]
    );
    connection.release();

    res.status(201).json({
      id: (result as any).insertId,
      username,
      nombre,
      unidad_organica,
      cargo,
      rol,
      estado: 1,
    });
  } catch (error: any) {
    console.error("Error en createUsuario:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    res.status(500).json({ error: error.message });
  }
};

// PUT update usuario
export const updateUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nombre, unidad_organica, cargo, rol } =
      req.body;

    if (!username || !nombre) {
      return res
        .status(400)
        .json({ error: "username y nombre son requeridos" });
    }

    let query =
      "UPDATE usuarios SET username = ?, nombre = ?, unidad_organica = ?, cargo = ?, rol = ?";
    const params: any[] = [username, nombre, unidad_organica, cargo, rol];

    if (password) {
      query += ", password = ?";
      params.push(password);
    }

    query += " WHERE id = ?";
    params.push(id);

    const connection = await pool.getConnection();
    const [result] = await connection.query(query, params);
    connection.release();

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true, message: "Usuario actualizado" });
  } catch (error: any) {
    console.error("Error en updateUsuario:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE usuario (soft delete)
export const deleteUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "UPDATE usuarios SET estado = 0 WHERE id = ?",
      [id]
    );
    connection.release();

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true, message: "Usuario eliminado" });
  } catch (error: any) {
    console.error("Error en deleteUsuario:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST login
export const login: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username y password son requeridos" });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT id, username, nombre, unidad_organica, cargo, rol FROM usuarios WHERE username = ? AND password = ?",
      [username, password]
    );
    connection.release();

    if ((rows as any[]).length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    res.json((rows as any[])[0]);
  } catch (error: any) {
    console.error("Error en login:", error);
    res.status(500).json({ error: error.message });
  }
};
