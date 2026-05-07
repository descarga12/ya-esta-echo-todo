import { RequestHandler } from "express";
import pool from "../lib/db";

/**
 * Lista reciente de detalle de ingresos para vistas rápidas.
 * Se limita a 100 registros para evitar respuestas pesadas.
 */
export const getDetalleIngreso: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT * FROM alm_detalle_ingreso ORDER BY id DESC LIMIT 100");
    connection.release();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Filtra el detalle por `idingreso` para ver líneas de un ingreso específico.
 */
export const getDetalleIngresoByIngreso: RequestHandler = async (req, res) => {
  try {
    const { idingreso } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT * FROM alm_detalle_ingreso WHERE idingreso = ?", [idingreso]);
    connection.release();
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
