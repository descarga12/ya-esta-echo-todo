import { RequestHandler } from "express";
import pool from "../lib/db";

// GET /api/bienes - Listar todos los bienes
export const getBienes: RequestHandler = async (req, res) => {
  try {
    console.log("[API /bienes] Starting request...");
    const connection = await pool.getConnection();
    console.log("[API /bienes] Got DB connection");
    
    // First check if table exists
    const [tables]: any = await connection.query(
      "SHOW TABLES LIKE 'qr_bienes'"
    );
    console.log("[API /bienes] Table check:", tables.length > 0 ? "EXISTS" : "NOT FOUND");
    
    if (tables.length === 0) {
      connection.release();
      return res.status(500).json({ 
        error: "La tabla 'qr_bienes' no existe en la base de datos",
        tables_found: await connection.query("SHOW TABLES").then(([t]: any) => t.slice(0, 10).map((row: any) => Object.values(row)[0]))
      });
    }
    
    // Get table columns
    const [columns]: any = await connection.query("DESCRIBE qr_bienes");
    console.log("[API /bienes] Table columns:", columns.map((c: any) => c.Field).join(", "));
    
    const [rows] = await connection.query(
      "SELECT * FROM qr_bienes ORDER BY id DESC"
    );
    console.log("[API /bienes] Query success, rows:", (rows as any[]).length);
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error("[API /bienes] FULL ERROR:", error);
    res.status(500).json({ error: "Error al obtener bienes", details: error.message, code: error.code });
  }
};

// GET /api/bienes/:id - Obtener un bien por ID
export const getBienById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM qr_bienes WHERE id = ?",
      [id]
    );
    connection.release();
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: "Bien no encontrado" });
      return;
    }
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener bien" });
  }
};

// POST /api/bienes - Crear un nuevo bien
export const createBien: RequestHandler = async (req, res) => {
  try {
    const {
      id,
      nombre,
      sku,
      cantidad,
      ubicacion,
      foto,
      qr_code,
      registrado_por,
      registrado_nombre,
      registrado_unidad,
      registrado_cargo,
    } = req.body;

    if (!nombre || !sku) {
      res.status(400).json({ error: "Nombre y SKU son requeridos" });
      return;
    }

    const bienId = id || crypto.randomUUID();
    const connection = await pool.getConnection();

    await connection.query(
      `INSERT INTO qr_bienes (id, nombre, sku, cantidad, ubicacion, foto, qr_code, registrado_por, registrado_nombre, registrado_unidad, registrado_cargo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bienId, nombre, sku, cantidad || 0, ubicacion || null, foto || null, qr_code || null, registrado_por || null, registrado_nombre || null, registrado_unidad || null, registrado_cargo || null]
    );

    const [rows] = await connection.query("SELECT * FROM qr_bienes WHERE id = ?", [bienId]);
    connection.release();

    res.status(201).json((rows as any[])[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "Ya existe un bien con ese SKU" });
      return;
    }
    res.status(500).json({ error: "Error al crear bien", details: error.message });
  }
};

// PUT /api/bienes/:id - Actualizar un bien
export const updateBien: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const connection = await pool.getConnection();

    // Verificar que el bien existe
    const [existing]: any = await connection.query("SELECT * FROM qr_bienes WHERE id = ?", [id]);
    if (existing.length === 0) {
      connection.release();
      res.status(404).json({ error: "Bien no encontrado" });
      return;
    }

    // Construir query dinámica
    const allowedFields = ["nombre", "sku", "cantidad", "ubicacion", "foto", "qr_code", "registrado_por", "registrado_nombre", "registrado_unidad", "registrado_cargo"];
    const fields: string[] = [];
    const values: any[] = [];

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) {
      connection.release();
      res.status(400).json({ error: "No hay campos para actualizar" });
      return;
    }

    values.push(id);
    await connection.query(`UPDATE qr_bienes SET ${fields.join(", ")} WHERE id = ?`, values);

    const [rows] = await connection.query("SELECT * FROM qr_bienes WHERE id = ?", [id]);
    connection.release();

    res.json((rows as any[])[0]);
  } catch (error: any) {
    console.error(error);
    if (error.code === "ER_DUP_ENTRY") {
      res.status(409).json({ error: "Ya existe un bien con ese SKU" });
      return;
    }
    res.status(500).json({ error: "Error al actualizar bien", details: error.message });
  }
};

// DELETE /api/bienes/:id - Eliminar un bien
export const deleteBien: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [existing]: any = await connection.query("SELECT * FROM qr_bienes WHERE id = ?", [id]);
    if (existing.length === 0) {
      connection.release();
      res.status(404).json({ error: "Bien no encontrado" });
      return;
    }

    await connection.query("DELETE FROM qr_bienes WHERE id = ?", [id]);
    connection.release();

    res.json({ message: "Bien eliminado correctamente", id });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar bien", details: error.message });
  }
};
