import { RequestHandler } from "express";
import pool from "../lib/db";

/**
 * ============================================
 * API DE COMPROBANTES (RUTAS EXISTENTES)
 * ============================================
 * 
 * Este módulo proporciona endpoints para consultar
 * comprobantes desde la tabla alm_comprobante.
 * 
 * Nota: Estos son endpoints de solo lectura para
 * mantener compatibilidad con datos existentes.
 */

/**
 * Obtiene todos los comprobantes activos.
 * Endpoint: GET /api/comprobantes
 */
export const getComprobantes: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM alm_comprobante WHERE estado = 1"
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener comprobantes" });
  }
};

/**
 * Obtiene un comprobante específico por su ID.
 * Endpoint: GET /api/comprobantes/:id
 * 
 * @param id - ID del comprobante (id_compro)
 */
export const getComprobanteById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM alm_comprobante WHERE id_compro = ?",
      [id]
    );
    connection.release();
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: "Comprobante no encontrado" });
      return;
    }
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener comprobante" });
  }
};
