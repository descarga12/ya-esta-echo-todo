/**
 * ============================================
 * API DE USUARIOS - TABLAS PAT REALES (FIXED)
 * ============================================
 * 
 * Usa las tablas reales del sistema PAT con detección dinámica de columnas
 */

import { RequestHandler } from "express";
import pool from "../lib/db";
import bcrypt from "bcryptjs";

// Función auxiliar para obtener columnas de una tabla
async function getTableColumns(connection: any, tableName: string): Promise<string[]> {
  const [columns] = await connection.query(`DESCRIBE ${tableName}`);
  return (columns as any[]).map((c: any) => c.Field);
}

// Función para mapear campos comunes
function mapUserFields(columns: string[], prefix = '') {
  const p = prefix ? `${prefix}.` : '';
  const fields: string[] = [];
  
  const lower = columns.map(c => c.toLowerCase());
  const findExact = (name: string) => {
    const idx = lower.indexOf(name.toLowerCase());
    return idx >= 0 ? columns[idx] : undefined;
  };
  const findFirstExisting = (candidates: string[]) => {
    for (const cand of candidates) {
      const exact = findExact(cand);
      if (exact) return exact;
      const partial = columns.find(c => c.toLowerCase().includes(cand.toLowerCase()));
      if (partial) return partial;
    }
    return undefined;
  };

  // ID
  const idCol = columns.find(c => c.toLowerCase() === 'id' || c.toLowerCase().includes('id') || c.toLowerCase().includes('cod'));
  if (idCol) fields.push(`${p}${idCol} as id`);
  
  // Username/nombre de usuario
  // Importante: elegir por prioridad (no por el orden en la tabla)
  const userCol = findFirstExisting([
    "nom_usu",
    "usuario",
    "username",
    "login",
    "nrodoc",
    "dni",
    "idusu",
    "idpatusu",
    "apenom",
  ]);
  if (userCol) fields.push(`${p}${userCol} as username`);
  
  // Password
  const passCol = columns.find(c => 
    c.toLowerCase().includes('pass') || 
    c.toLowerCase().includes('contra') || 
    c.toLowerCase().includes('clave')
  );
  if (passCol) fields.push(`${p}${passCol} as password_hash`);
  
  // Nombres
  const nomCol = findFirstExisting(["nombres", "nombre"]);
  
  // Apellidos
  const apeCol = findFirstExisting(["apellidos", "apellido", "ape"]);
  
  // Construir nombre completo
  if (nomCol && apeCol) {
    fields.push(`CONCAT(${p}${nomCol}, ' ', ${p}${apeCol}) as nombre`);
  } else if (nomCol) {
    fields.push(`${p}${nomCol} as nombre`);
  } else if (apeCol) {
    fields.push(`${p}${apeCol} as nombre`);
  }
  
  // Cargo / perfil
  const carCol = findFirstExisting(["cargo", "rol", "car", "profe"]);
  if (carCol) fields.push(`${p}${carCol} as cargo`);
  
  // Unidad/Código de unidad
  const uniCol = findFirstExisting(["codlocal", "unidad", "uni", "depto", "area", "activ"]);
  if (uniCol) fields.push(`${p}${uniCol} as unidad_codigo`);
  
  // Estado / activo
  const estCol = findFirstExisting(["estado", "est"]);
  if (estCol) fields.push(`${p}${estCol} as estado`);
  
  return { fields, idCol, userCol, passCol, estCol, uniCol };
}

/**
 * LOGIN DE USUARIO
 * Endpoint: POST /api/usuarios/login
 */
export const loginUsuario: RequestHandler = async (req, res) => {
  try {
    const { username, password } = (req.body ?? {}) as any;

    if (!username || !password) {
      return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    }

    const connection = await pool.getConnection();
    
    // Obtener columnas reales
    const columns = await getTableColumns(connection, 'pat_usu');
    console.log("[DEBUG] Columnas en pat_usu:", columns);
    
    const { fields, userCol, passCol, estCol } = mapUserFields(columns);
    
    // Construir WHERE dinámico
    const whereConditions: string[] = [];
    const params: any[] = [];
    
    if (userCol) {
      whereConditions.push(`${userCol} = ?`);
      params.push(username);
    }
    if (estCol) {
      whereConditions.push(`(${estCol} = '1' OR ${estCol} = 1 OR ${estCol} IS NULL)`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    const query = `SELECT ${fields.join(', ')} FROM pat_usu WHERE ${whereClause}`;
    console.log("[DEBUG] Query login:", query);
    
    const [rows] = await connection.query(query, params);
    connection.release();

    const users = rows as any[];
    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = users[0];

    // Verificar contraseña
    let isMatch = false;
    if (user.password_hash && typeof user.password_hash === 'string' && user.password_hash.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else if (user.password_hash !== undefined && user.password_hash !== null) {
      isMatch = password === user.password_hash;
    } else if (userCol && ['nrodoc', 'idusu', 'idpatusu'].includes(userCol.toLowerCase())) {
      // Si no hay columna de contraseña, usar el mismo DNI/ID como fallback de login
      isMatch = password === user.username;
    }

    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token
    const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString('base64');

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        unidad_organica: user.unidad_codigo,
        cargo: user.cargo,
        rol: user.cargo?.toLowerCase().includes('admin') ? 'admin' : 'registrar'
      },
    });
  } catch (error: any) {
    console.error("[ERROR login]:", error);
    res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
};

/**
 * LISTAR TODOS LOS USUARIOS
 * Endpoint: GET /api/usuarios
 */
export const listUsuarios: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Obtener columnas
    const columns = await getTableColumns(connection, 'pat_usu');
    const { fields, idCol, estCol } = mapUserFields(columns, 'pu');
    
    // Construir query
    let query = `SELECT ${fields.join(', ')} FROM pat_usu pu`;
    
    if (estCol) {
      query += ` WHERE (pu.${estCol} = 1 OR pu.${estCol} IS NULL)`;
    }
    
    const nameCol = columns.find(c => c.toLowerCase().includes('nom'));
    if (nameCol) {
      query += ` ORDER BY pu.${nameCol}`;
    }
    
    console.log("[DEBUG] Query listUsuarios:", query);
    
    const [rows] = await connection.query(query);
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error("[ERROR listUsuarios]:", error);
    res.status(500).json({ error: "Error al obtener usuarios", details: error.message });
  }
};

/**
 * OBTENER USUARIO POR ID
 * Endpoint: GET /api/usuarios/:id
 */
export const getUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    const columns = await getTableColumns(connection, 'pat_usu');
    const { fields, idCol } = mapUserFields(columns, 'pu');
    
    if (!idCol) {
      connection.release();
      return res.status(500).json({ error: "No se encontró columna de ID" });
    }
    
    const query = `SELECT ${fields.join(', ')} FROM pat_usu pu WHERE pu.${idCol} = ?`;
    console.log("[DEBUG] Query getUsuario:", query);
    
    const [rows] = await connection.query(query, [id]);
    connection.release();
    
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    
    res.json((rows as any[])[0]);
  } catch (error: any) {
    console.error("[ERROR getUsuario]:", error);
    res.status(500).json({ error: "Error al obtener usuario", details: error.message });
  }
};

/**
 * OBTENER USUARIO ACTUAL
 * Endpoint: GET /api/usuarios/me
 */
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    const connection = await pool.getConnection();
    
    const columns = await getTableColumns(connection, 'pat_usu');
    const { fields, idCol } = mapUserFields(columns, 'pu');
    
    if (!idCol) {
      connection.release();
      return res.status(500).json({ error: "No se encontró columna de ID" });
    }
    
    const query = `SELECT ${fields.join(', ')} FROM pat_usu pu WHERE pu.${idCol} = ?`;
    console.log("[DEBUG] Query getCurrentUser:", query);
    
    const [rows] = await connection.query(query, [decoded.id]);
    connection.release();
    
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }
    
    res.json((rows as any[])[0]);
  } catch (error: any) {
    console.error("[ERROR getCurrentUser]:", error);
    res.status(500).json({ error: "Error al obtener usuario", details: error.message });
  }
};

/**
 * CREAR USUARIO
 * Endpoint: POST /api/usuarios
 */
export const createUsuario: RequestHandler = async (req, res) => {
  try {
    const body = req.body;
    
    const connection = await pool.getConnection();
    const columns = await getTableColumns(connection, 'pat_usu');
    
    // Construir INSERT dinámico
    const insertFields: string[] = [];
    const insertValues: any[] = [];
    
    // Mapear campos del body a columnas
    for (const [key, value] of Object.entries(body)) {
      const col = columns.find(c => c.toLowerCase() === key.toLowerCase());
      if (col && value !== undefined && value !== null) {
        insertFields.push(col);
        insertValues.push(value);
      }
    }
    
    // Agregar estado si existe
    const estCol = columns.find(c => c.toLowerCase().includes('est'));
    if (estCol && !insertFields.includes(estCol)) {
      insertFields.push(estCol);
      insertValues.push(1);
    }
    
    if (insertFields.length === 0) {
      connection.release();
      return res.status(400).json({ error: "No hay campos válidos para insertar" });
    }
    
    const placeholders = insertValues.map(() => '?').join(', ');
    const query = `INSERT INTO pat_usu (${insertFields.join(', ')}) VALUES (${placeholders})`;
    console.log("[DEBUG] Query createUsuario:", query);
    
    const [result] = await connection.query(query, insertValues);
    connection.release();
    
    res.status(201).json({ 
      message: "Usuario creado exitosamente",
      id: (result as any).insertId
    });
  } catch (error: any) {
    console.error("[ERROR createUsuario]:", error);
    res.status(500).json({ error: "Error al crear usuario", details: error.message });
  }
};

/**
 * ACTUALIZAR USUARIO
 * Endpoint: PUT /api/usuarios/:id
 */
export const updateUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    const connection = await pool.getConnection();
    const columns = await getTableColumns(connection, 'pat_usu');
    
    // Construir UPDATE dinámico
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    for (const [key, value] of Object.entries(body)) {
      const col = columns.find(c => c.toLowerCase() === key.toLowerCase());
      if (col && value !== undefined) {
        updateFields.push(`${col} = ?`);
        updateValues.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }
    
    const idCol = columns.find(c => c.toLowerCase().includes('id') || c.toLowerCase().includes('cod'));
    if (!idCol) {
      connection.release();
      return res.status(500).json({ error: "No se encontró columna de ID" });
    }
    
    updateValues.push(id);
    const query = `UPDATE pat_usu SET ${updateFields.join(', ')} WHERE ${idCol} = ?`;
    console.log("[DEBUG] Query updateUsuario:", query);
    
    await connection.query(query, updateValues);
    connection.release();
    
    res.json({ message: "Usuario actualizado" });
  } catch (error: any) {
    console.error("[ERROR updateUsuario]:", error);
    res.status(500).json({ error: "Error al actualizar usuario", details: error.message });
  }
};

/**
 * DAR DE BAJA USUARIO
 * Endpoint: DELETE /api/usuarios/:id
 */
export const deleteUsuario: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    const columns = await getTableColumns(connection, 'pat_usu');
    
    const idCol = columns.find(c => c.toLowerCase().includes('id') || c.toLowerCase().includes('cod'));
    const estCol = columns.find(c => c.toLowerCase().includes('est'));
    
    if (!idCol) {
      connection.release();
      return res.status(500).json({ error: "No se encontró columna de ID" });
    }
    
    if (estCol) {
      // Eliminación lógica
      await connection.query(
        `UPDATE pat_usu SET ${estCol} = 0 WHERE ${idCol} = ?`,
        [id]
      );
      res.json({ message: "Usuario dado de baja (eliminación lógica)" });
    } else {
      // Eliminación física
      await connection.query(
        `DELETE FROM pat_usu WHERE ${idCol} = ?`,
        [id]
      );
      res.json({ message: "Usuario eliminado" });
    }
    
    connection.release();
  } catch (error: any) {
    console.error("[ERROR deleteUsuario]:", error);
    res.status(500).json({ error: "Error al dar de baja usuario", details: error.message });
  }
};

/**
 * CAMBIAR CONTRASEÑA
 * Endpoint: PUT /api/usuarios/password
 */
export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { id, newPassword } = req.body;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const connection = await pool.getConnection();
    const columns = await getTableColumns(connection, 'pat_usu');
    
    const idCol = columns.find(c => c.toLowerCase().includes('id') || c.toLowerCase().includes('cod'));
    const passCol = columns.find(c => c.toLowerCase().includes('pass') || c.toLowerCase().includes('contra'));
    
    if (!idCol || !passCol) {
      connection.release();
      return res.status(500).json({ error: "No se encontraron columnas necesarias" });
    }
    
    await connection.query(
      `UPDATE pat_usu SET ${passCol} = ? WHERE ${idCol} = ?`,
      [hashedPassword, id]
    );
    
    connection.release();
    res.json({ message: "Contraseña actualizada" });
  } catch (error: any) {
    console.error("[ERROR changePassword]:", error);
    res.status(500).json({ error: "Error al cambiar contraseña", details: error.message });
  }
};
