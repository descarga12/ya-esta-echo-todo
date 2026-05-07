import { RequestHandler } from "express";
import pool from "../lib/db";

/**
 * ============================================
 * API DE PRODUCTOS DE ALMACÉN
 * ============================================
 * 
 * Este módulo proporciona endpoints para consultar
 * productos desde la tabla alm_producto.
 */

/**
 * Obtiene todos los productos de almacén.
 * Endpoint: GET /api/productos
 */
export const getProductos: RequestHandler = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT p.*, CONCAT(u.nombres, ' ', u.apellidos) as registrado_nombre 
       FROM alm_producto p 
       LEFT JOIN users u ON p.id_user = u.id 
       WHERE p.estado = 1 
       ORDER BY p.created_at DESC`
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener productos de almacén" });
  }
};

/**
 * Obtiene un producto específico por su ID.
 * Endpoint: GET /api/productos/:id
 */
export const getProductoById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT p.*, CONCAT(u.nombres, ' ', u.apellidos) as registrado_nombre 
       FROM alm_producto p 
       LEFT JOIN users u ON p.id_user = u.id 
       WHERE p.id = ?`,
      [id]
    );
    connection.release();
    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: "Producto de almacén no encontrado" });
      return;
    }
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener producto de almacén" });
  }
};

/**
 * Crea un nuevo producto de almacén.
 * Endpoint: POST /api/productos
 */
export const createProducto: RequestHandler = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, costo_unit, stock, unidad, idalmacen, id_user } = req.body;
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO alm_producto (codigo, nombre, descripcion, costo_unit, stock, unidad, idalmacen, id_user, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)",
      [codigo, nombre, descripcion, costo_unit, stock, unidad, idalmacen, id_user]
    );
    connection.release();
    res.status(201).json({ id: (result as any).insertId, message: "Producto creado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear producto de almacén" });
  }
};

/**
 * Actualiza un producto de almacén existente.
 * Endpoint: PUT /api/productos/:id
 */
export const updateProducto: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, descripcion, costo_unit, stock, unidad, idalmacen, estado } = req.body;
    const connection = await pool.getConnection();
    await connection.query(
      "UPDATE alm_producto SET codigo = ?, nombre = ?, descripcion = ?, costo_unit = ?, stock = ?, unidad = ?, idalmacen = ?, estado = ? WHERE id = ?",
      [codigo, nombre, descripcion, costo_unit, stock, unidad, idalmacen, estado ?? 1, id]
    );
    connection.release();
    res.json({ message: "Producto actualizado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar producto de almacén" });
  }
};

/**
 * Elimina (lógicamente) un producto de almacén.
 * Endpoint: DELETE /api/productos/:id
 */
export const deleteProducto: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    await connection.query(
      "UPDATE alm_producto SET estado = 0 WHERE id = ?",
      [id]
    );
    connection.release();
    res.json({ message: "Producto eliminado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar producto de almacén" });
  }
};
