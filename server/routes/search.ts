import { RequestHandler } from "express";
import pool from "../lib/db";
import { SearchResponse, SearchResult } from "../../shared/api";

/**
 * ============================================
 * API DE BÚSQUEDA GLOBAL (BUILDER SEARCH)
 * ============================================
 * 
 * Este módulo realiza búsquedas en múltiples tablas
 * del sistema para ofrecer resultados centralizados.
 */

export const handleGlobalSearch: RequestHandler = async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== "string") {
    return res.json({ results: [] });
  }

  const query = `%${q}%`;
  const results: SearchResult[] = [];
  let connection;

  try {
    connection = await pool.getConnection();

    // 1. Buscar en Bienes (pat_bien)
    try {
      const [bienes]: any = await connection.query(
        "SELECT codbien as id, descbien as title, codbien as subtitle FROM pat_bien WHERE descbien LIKE ? OR codbien LIKE ? LIMIT 5",
        [query, query]
      );
      bienes.forEach((b: any) => results.push({ 
        table: "pat_bien", 
        id: b.id, 
        title: b.title, 
        subtitle: `SKU: ${b.subtitle}`, 
        type: "Bien / Activo" 
      }));
    } catch (e) {
      console.warn("Error buscando en pat_bien:", e);
    }

    // 2. Buscar en Usuarios (users)
    try {
      const [usuarios]: any = await connection.query(
        `SELECT id, CONCAT(nombres, ' ', apellidos) as title, name as subtitle, cargo 
         FROM users 
         WHERE nombres LIKE ? OR apellidos LIKE ? OR name LIKE ? OR cargo LIKE ? LIMIT 5`,
        [query, query, query, query]
      );
      usuarios.forEach((u: any) => results.push({ 
        table: "users", 
        id: u.id, 
        title: u.title, 
        subtitle: `@${u.subtitle} - ${u.cargo}`, 
        type: "Personal" 
      }));
    } catch (e) {
      console.warn("Error buscando en users:", e);
    }

    // 3. Buscar en Ubicaciones (glob_detameta)
    try {
      const [ubicaciones]: any = await connection.query(
        "SELECT id, oficina as title FROM glob_detameta WHERE oficina LIKE ? LIMIT 5",
        [query]
      );
      ubicaciones.forEach((ub: any) => results.push({ 
        table: "glob_detameta", 
        id: ub.id, 
        title: ub.title, 
        type: "Ubicación" 
      }));
    } catch (e) {
      console.warn("Error buscando en glob_detameta:", e);
    }

    // 4. Buscar en Unidades (tes_unidad_organica)
    try {
      const [unidades]: any = await connection.query(
        "SELECT id, nombre as title FROM tes_unidad_organica WHERE nombre LIKE ? LIMIT 5",
        [query]
      );
      unidades.forEach((un: any) => results.push({ 
        table: "tes_unidad_organica", 
        id: un.id, 
        title: un.title, 
        type: "Unidad Orgánica" 
      }));
    } catch (e) {
      console.warn("Error buscando en tes_unidad_organica:", e);
    }

    // 5. Buscar en Categorías (alm_categoria)
    try {
      const [categorias]: any = await connection.query(
        "SELECT idcategoria as id, nombre as title FROM alm_categoria WHERE nombre LIKE ? LIMIT 5",
        [query]
      );
      categorias.forEach((c: any) => results.push({ 
        table: "alm_categoria", 
        id: c.id, 
        title: c.title, 
        type: "Categoría" 
      }));
    } catch (e) {
      console.warn("Error buscando en alm_categoria:", e);
    }

    // 6. Buscar en Comprobantes (alm_comprobante)
    try {
      const [comprobantes]: any = await connection.query(
        "SELECT id_compro as id, nom_docu as title FROM alm_comprobante WHERE nom_docu LIKE ? LIMIT 5",
        [query]
      );
      comprobantes.forEach((cp: any) => results.push({ 
        table: "alm_comprobante", 
        id: cp.id, 
        title: cp.title, 
        type: "Comprobante" 
      }));
    } catch (e) {
      console.warn("Error buscando en alm_comprobante:", e);
    }

    // 7. Buscar en Detalle de Ingreso (alm_detalle_ingreso)
    try {
      const [detalles]: any = await connection.query(
        "SELECT id, producto as title, codigo as subtitle FROM alm_detalle_ingreso WHERE producto LIKE ? OR codigo LIKE ? LIMIT 5",
        [query, query]
      );
      detalles.forEach((d: any) => results.push({ 
        table: "alm_detalle_ingreso", 
        id: d.id, 
        title: d.title, 
        subtitle: `Código: ${d.subtitle}`, 
        type: "Detalle Ingreso" 
      }));
    } catch (e) {
      console.warn("Error buscando en alm_detalle_ingreso:", e);
    }

    // 8. Buscar en Productos de Almacén (alm_producto)
    try {
      const [productos]: any = await connection.query(
        "SELECT id, nombre as title, codigo as subtitle, stock FROM alm_producto WHERE nombre LIKE ? OR codigo LIKE ? OR descripcion LIKE ? LIMIT 5",
        [query, query, query]
      );
      productos.forEach((p: any) => results.push({ 
        table: "alm_producto", 
        id: p.id, 
        title: p.title, 
        subtitle: `Cód: ${p.subtitle} - Stock: ${p.stock}`, 
        type: "Producto Almacén" 
      }));
    } catch (e) {
      console.warn("Error buscando en alm_producto:", e);
    }

    const response: SearchResponse = { results };
    res.json(response);

  } catch (error: any) {
    console.error("Error en búsqueda global:", error);
    res.status(500).json({ error: "Error interno en la búsqueda", details: error.message });
  } finally {
    if (connection) connection.release();
  }
};
