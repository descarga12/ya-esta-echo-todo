import { Router } from "express";
import { handleDemo } from "./demo";
import { getCategorias, getCategoriaById } from "./categorias";
import { getComprobantes, getComprobanteById } from "./comprobantes";
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
} from "./productos";
import { handleGlobalSearch } from "./search";
import {
  getDetalleIngreso,
  getDetalleIngresoByIngreso,
} from "./ingreso";
import { handleUpload } from "./upload";
import {
  getBienes,
  getBienById,
  createBien,
  updateBien,
  deleteBien,
  getUbicaciones,
  getStats,
  getBajas,
} from "./bienes-pat";
import {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  loginUsuario,
  getCurrentUser,
} from "./usuarios-pat-fixed";

/**
 * Router único con todas las rutas bajo el prefijo `/api`.
 * El orden importa: rutas fijas (p. ej. /bienes/stats) antes de parámetros (/bienes/:id).
 */
export function createApiRouter(): Router {
  const api = Router();

  api.get("/", (_req, res) => {
    res.json({
      message: "API DSFD",
      endpoints: [
        "/api/ping",
        "/api/demo",
        "/api/search",
        "/api/categorias",
        "/api/comprobantes",
        "/api/productos",
        "/api/ingreso",
        "/api/upload",
        "/api/bienes",
        "/api/usuarios",
      ],
    });
  });

  api.get("/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  api.get("/demo", handleDemo);
  api.get("/search", handleGlobalSearch);

  api.get("/categorias", getCategorias);
  api.get("/categorias/:id", getCategoriaById);

  api.get("/comprobantes", getComprobantes);
  api.get("/comprobantes/:id", getComprobanteById);

  api.get("/productos", getProductos);
  api.get("/productos/:id", getProductoById);
  api.post("/productos", createProducto);
  api.put("/productos/:id", updateProducto);
  api.delete("/productos/:id", deleteProducto);

  api.get("/ingreso", getDetalleIngreso);
  api.get("/ingreso/:idingreso", getDetalleIngresoByIngreso);

  api.post("/upload", handleUpload);

  api.get("/bienes/ubicaciones", getUbicaciones);
  api.get("/bienes/stats", getStats);
  api.get("/bienes/bajas", getBajas);
  api.get("/bienes", getBienes);
  api.get("/bienes/:id", getBienById);
  api.post("/bienes", createBien);
  api.put("/bienes/:id", updateBien);
  api.delete("/bienes/:id", deleteBien);

  api.post("/usuarios/login", loginUsuario);
  api.get("/usuarios/me", getCurrentUser);
  api.get("/usuarios", listUsuarios);
  api.get("/usuarios/:id", getUsuario);
  api.post("/usuarios", createUsuario);
  api.put("/usuarios/:id", updateUsuario);
  api.delete("/usuarios/:id", deleteUsuario);

  // Manejador para rutas API no encontradas - Retorna JSON en lugar de HTML
  api.use((_req, res) => {
    res.status(404).json({ error: "Ruta API no encontrada" });
  });

  return api;
}
