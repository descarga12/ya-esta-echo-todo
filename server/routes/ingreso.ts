import { RequestHandler } from "express";
import pool from "../lib/db";

export const getDetalleIngreso: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM alm_detalle_ingreso LIMIT 100"
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching receipt details" });
  }
};

export const getDetalleIngresoByIngreso: RequestHandler = async (
  req,
  res
) => {
  try {
    const { idingreso } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      "SELECT * FROM alm_detalle_ingreso WHERE idingreso = ?",
      [idingreso]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching receipt details" });
  }
};
