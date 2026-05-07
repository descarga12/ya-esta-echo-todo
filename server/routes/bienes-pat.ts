/**
 * ============================================
 * API DE GESTIÓN DE BIENES - TABLAS PAT REALES
 * ============================================
 * 
 * Este módulo usa las tablas reales del sistema PAT:
 * - pat_bien: Bienes del inventario
 * - pat_detabaja: Bienes dados de baja
 * - pre_unid_med_ptrabajo: Ubicaciones/departamentos
 * - tes_unidad_organica: Unidades orgánicas
 */

import { RequestHandler } from "express";
import pool from "../lib/db";

/**
 * OBTENER TODOS LOS BIENES
 * Tabla: pat_bien
 * Endpoint: GET /api/bienes
 */
export const getBienes: RequestHandler = async (req, res) => {
  try {
    const { unidad, rol } = req.query;
    const connection = await pool.getConnection();

    // Mapear campos de pat_bien al formato que espera el frontend
    let query = `SELECT 
      p.codbien as id,
      p.descbien as nombre,
      p.codbien as sku,
      COALESCE(p.cant, 1) as cantidad,
      p.ubicacion,
      uo.nombre as registrado_unidad,
      CONCAT_WS(' ', u.nombres, u.apellidos) as registrado_nombre,
      p.idpatusu as registrado_por,
      u.tipotra as registrado_cargo,
      p.estadobien as cod_estado,
      p.marca,
      p.modelo,
      p.tipo,
      p.valoradq as valor_adquisicion
    FROM pat_bien p
    LEFT JOIN pat_usu u ON u.id = p.idpatusu
    LEFT JOIN tes_unidad_organica uo ON uo.id = p.iduniorga`;
    const params: any[] = [];

    // Si no es administrador y se proporciona una unidad, filtrar
    if (rol?.toString().toUpperCase() !== 'ADMIN' && unidad) {
      query += ` WHERE p.iduniorga = ?`;
      params.push(unidad);
    }

    query += ` ORDER BY codbien DESC`;

    const [rows] = await connection.query(query, params);
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener bienes", details: error.message });
  }
};

/**
 * OBTENER TODAS LAS UBICACIONES
 * Tabla: pre_unid_med_ptrabajo
 * Endpoint: GET /api/bienes/ubicaciones
 */
export const getUbicaciones: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT cod_unidad as id, nom_unidad as nombre FROM pre_unid_med_ptrabajo WHERE estado = 1 OR estado IS NULL"
    );
    connection.release();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * OBTENER UN BIEN POR SU ID
 * Tabla: pat_bien
 * Endpoint: GET /api/bienes/:id
 */
export const getBienById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    
    const [rows] = await connection.query(
      `SELECT 
        p.codbien as id,
        p.descbien as nombre,
        p.codbien as sku,
        COALESCE(p.cant, 1) as cantidad,
        p.ubicacion,
        uo.nombre as registrado_unidad,
        CONCAT_WS(' ', u.nombres, u.apellidos) as registrado_nombre,
        p.idpatusu as registrado_por,
        u.tipotra as registrado_cargo,
        p.estadobien as cod_estado,
        p.marca,
        p.modelo,
        p.tipo,
        p.valoradq as valor_adquisicion
      FROM pat_bien p
      LEFT JOIN pat_usu u ON u.id = p.idpatusu
      LEFT JOIN tes_unidad_organica uo ON uo.id = p.iduniorga
      WHERE p.codbien = ?`,
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

/**
 * OBTENER ESTADÍSTICAS DE BIENES
 * Endpoint: GET /api/bienes/stats
 */
export const getStats: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Total de bienes
    const [totalResult] = await connection.query(
      "SELECT COUNT(*) as total FROM pat_bien"
    );
    
    // Bienes por unidad (usando iduniorga que es el código de unidad en pat_bien)
    const [porUnidad] = await connection.query(
      `SELECT pb.iduniorga as unidad_codigo, COUNT(*) as cantidad 
       FROM pat_bien pb
       WHERE pb.iduniorga IS NOT NULL
       GROUP BY pb.iduniorga`
    );
    
    connection.release();
    
    res.json({
      summary: {
        total: (totalResult as any[])[0].total
      },
      porUnidad: porUnidad
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * CREAR UN NUEVO BIEN
 * Tabla: pat_bien
 * Endpoint: POST /api/bienes
 */
export const createBien: RequestHandler = async (req, res) => {
  try {
    const {
      sku,
      nombre,
      cantidad,
      ubicacion,
      registrado_unidad,
      estadobien,
      registrado_por,
      marca,
      modelo,
      tipo
    } = req.body;

    const connection = await pool.getConnection();
    
    const [result] = await connection.query(
      `INSERT INTO pat_bien (codbien, descbien, cant, ubicacion, iduniorga, estadobien, idpatusu, marca, modelo, tipo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, nombre, cantidad ?? 1, ubicacion, registrado_unidad, estadobien || 'A', registrado_por, marca, modelo, tipo]
    );
    
    connection.release();
    
    res.status(201).json({ 
      id: sku,
      message: "Bien creado exitosamente" 
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Error al crear bien", details: error.message });
  }
};

/**
 * ACTUALIZAR UN BIEN
 * Tabla: pat_bien
 * Endpoint: PUT /api/bienes/:id
 */
export const updateBien: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const connection = await pool.getConnection();
    
    // Construir query dinámica
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.nombre !== undefined) {
      fields.push("descbien = ?");
      values.push(updates.nombre);
    }
    if (updates.ubicacion !== undefined) {
      fields.push("ubicacion = ?");
      values.push(updates.ubicacion);
    }
    if (updates.registrado_unidad !== undefined) {
      fields.push("iduniorga = ?");
      values.push(updates.registrado_unidad);
    }
    if (updates.estadobien !== undefined) {
      fields.push("estadobien = ?");
      values.push(updates.estadobien);
    }
    if (updates.registrado_por !== undefined) {
      fields.push("idpatusu = ?");
      values.push(updates.registrado_por);
    }
    if (updates.marca !== undefined) {
      fields.push("marca = ?");
      values.push(updates.marca);
    }
    if (updates.modelo !== undefined) {
      fields.push("modelo = ?");
      values.push(updates.modelo);
    }
    if (updates.cantidad !== undefined) {
      fields.push("cant = ?");
      values.push(updates.cantidad);
    }
    if (updates.tipo !== undefined) {
      fields.push("tipo = ?");
      values.push(updates.tipo);
    }
    
    if (fields.length === 0) {
      res.status(400).json({ error: "No hay campos para actualizar" });
      return;
    }
    
    values.push(id);
    
    await connection.query(
      `UPDATE pat_bien SET ${fields.join(", ")} WHERE codbien = ?`,
      values
    );
    
    connection.release();
    res.json({ message: "Bien actualizado exitosamente" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar bien" });
  }
};

/**
 * ELIMINAR/BAJA UN BIEN
 * Mueve el bien a pat_detabaja
 * Endpoint: DELETE /api/bienes/:id
 */
export const deleteBien: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, dado_baja_por } = req.body;
    
    const connection = await pool.getConnection();
    
    // 1. Obtener el bien
    const [bienes] = await connection.query(
      "SELECT * FROM pat_bien WHERE codbien = ?",
      [id]
    );
    
    if ((bienes as any[]).length === 0) {
      res.status(404).json({ error: "Bien no encontrado" });
      return;
    }
    
    const bien = (bienes as any[])[0];
    
    // 2. Obtener columnas reales de pat_detabaja
    const [columns] = await connection.query("DESCRIBE pat_detabaja");
    const columnNames = (columns as any[]).map((c: any) => c.Field);
    console.log("[DEBUG] Columnas disponibles:", columnNames);
    
    // 3. Construir INSERT dinámico según columnas existentes
    const insertFields: string[] = [];
    const insertValues: any[] = [];
    
    if (columnNames.includes('codbien')) {
      insertFields.push('codbien');
      insertValues.push(bien.codbien);
    }
    if (columnNames.includes('descbien') || columnNames.includes('descripcion')) {
      insertFields.push(columnNames.includes('descbien') ? 'descbien' : 'descripcion');
      insertValues.push(bien.descbien || bien.descripcion || bien.descrip);
    }
    if (columnNames.includes('iduniorga')) {
      insertFields.push('iduniorga');
      insertValues.push(bien.iduniorga);
    }
    if (columnNames.includes('duniorqa')) {
      insertFields.push('duniorqa');
      insertValues.push(bien.duniorqa);
    }
    // Buscar columna de fecha
    const fechaCol = columnNames.find((c: string) => 
      c.toLowerCase().includes('fec') || 
      c.toLowerCase().includes('fecha') ||
      c.toLowerCase().includes('date')
    );
    if (fechaCol) {
      insertFields.push(fechaCol);
      insertValues.push(new Date());
    }
    if (columnNames.includes('motivo')) {
      insertFields.push('motivo');
      insertValues.push(motivo || 'Baja por sistema');
    }
    if (columnNames.includes('dado_baja_por') || columnNames.includes('usuario_baja')) {
      const userCol = columnNames.includes('dado_baja_por') ? 'dado_baja_por' : 'usuario_baja';
      insertFields.push(userCol);
      insertValues.push(dado_baja_por);
    }
    
    if (insertFields.length > 0) {
      const placeholders = insertValues.map(() => '?').join(', ');
      const insertQuery = `INSERT INTO pat_detabaja (${insertFields.join(', ')}) VALUES (${placeholders})`;
      console.log("[DEBUG] Query INSERT:", insertQuery);
      await connection.query(insertQuery, insertValues);
    }
    
    // 3. Eliminar de pat_bien (o marcar como baja según tu lógica)
    // Opción A: Eliminar físicamente
    await connection.query("DELETE FROM pat_bien WHERE codbien = ?", [id]);
    
    // Opción B: Si prefieres marcar como baja en lugar de eliminar:
    // await connection.query("UPDATE pat_bien SET estadobien = 'B' WHERE codbien = ?", [id]);
    
    connection.release();
    
    res.json({ message: "Bien dado de baja exitosamente" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: "Error al dar de baja el bien" });
  }
};

/**
 * OBTENER BIENES DADOS DE BAJA
 * Tabla: pat_detabaja
 * Endpoint: GET /api/bienes/bajas
 */
export const getBajas: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    // Verificar qué columnas existen primero
    const [columns] = await connection.query("DESCRIBE pat_detabaja");
    console.log("[DEBUG] Columnas en pat_detabaja:", columns);
    
    // Buscar columna de fecha
    const fechaCol = (columns as any[]).find((c: any) => 
      c.Field.toLowerCase().includes('fec') || 
      c.Field.toLowerCase().includes('fecha') ||
      c.Field.toLowerCase().includes('date')
    );
    
    let query = "SELECT * FROM pat_detabaja";
    if (fechaCol) {
      query += ` ORDER BY ${fechaCol.Field} DESC`;
    }
    
    const [rows] = await connection.query(query);
    connection.release();
    res.json(rows);
  } catch (error: any) {
    console.error("[ERROR getBajas]:", error);
    res.status(500).json({ error: error.message });
  }
};
