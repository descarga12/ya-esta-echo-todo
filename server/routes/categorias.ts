import { RequestHandler } from "express";
import pool from "../lib/db";

/**
 * Rutas de solo lectura para categorías de almacén.
 * Se consultan desde la tabla `alm_categoria`.
 */
export const getCategorias: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM alm_categoria WHERE estado = 1"
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching categories" });
  }
};

/**
 * Obtiene una categoría puntual por su ID lógico (`idcategoria`).
 */
export const getCategoriaById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM alm_categoria WHERE idcategoria = ?",
      [id]
    );
    connection.release();
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching category" });
  }
};
