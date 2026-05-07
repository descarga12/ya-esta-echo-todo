import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { getCategorias, getCategoriaById } from "./routes/categorias";
import { getComprobantes, getComprobanteById } from "./routes/comprobantes";
import { getProductos, getProductoById, createProducto, updateProducto, deleteProducto } from "./routes/productos";
import { handleGlobalSearch } from "./routes/search";
import {
  getDetalleIngreso,
  getDetalleIngresoByIngreso,
} from "./routes/ingreso";
import { handleUpload } from "./routes/upload";
import {
  getBienes,
  getBienById,
  createBien,
  updateBien,
  deleteBien,
  getUbicaciones,
  getStats,
  getBajas,
} from "./routes/bienes-pat";
import {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  loginUsuario,
  getCurrentUser,
} from "./routes/usuarios-pat-fixed";

/**
 * Construye la app Express con:
 * - middlewares globales (CORS, body parser, estáticos)
 * - rutas API
 * - fallback SPA para React Router
 */
export function createServer() {
  const app = express();

  // CORS
  // Nota: 'cors' NO soporta wildcards tipo "https://*.ngrok-free.dev" en arrays.
  // Usamos una función para permitir ngrok + localhost + capacitor.
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl / apps nativas

      const isLocal =
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://172.16.") ||
        origin.startsWith("http://172.17.") ||
        origin.startsWith("http://172.18.") ||
        origin.startsWith("http://172.19.") ||
        origin.startsWith("http://172.2") ||
        origin.startsWith("http://172.3");

      const isCapacitor = origin.startsWith("capacitor://localhost") || origin.startsWith("ionic://localhost");
      const isNgrok = origin.includes(".ngrok-free.app") || origin.includes(".ngrok-free.dev") || origin.includes(".ngrok.io");

      if (isLocal || isCapacitor || isNgrok) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), "public")));
  // Serve SPA static files from dist/spa
  app.use(express.static(path.join(process.cwd(), "dist", "spa")));

  // Example API routes
  app.get("/api", (_req, res) => {
    res.json({
      message: "API DSFD",
      endpoints: [
        "/api/ping",
        "/api/demo",
        "/api/categorias",
        "/api/comprobantes",
        "/api/ingreso",
        "/api/bienes",
        "/api/usuarios",
        "/api/upload"
      ]
    });
  });

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Global search
  app.get("/api/search", handleGlobalSearch);

  // Database routes - Categorías
  app.get("/api/categorias", getCategorias);
  app.get("/api/categorias/:id", getCategoriaById);

  // Database routes - Comprobantes
  app.get("/api/comprobantes", getComprobantes);
  app.get("/api/comprobantes/:id", getComprobanteById);

  // Database routes - Productos
  app.get("/api/productos", getProductos);
  app.get("/api/productos/:id", getProductoById);
  app.post("/api/productos", createProducto);
  app.put("/api/productos/:id", updateProducto);
  app.delete("/api/productos/:id", deleteProducto);

  // Database routes - Detalle Ingreso
  app.get("/api/ingreso", getDetalleIngreso);
  app.get("/api/ingreso/:idingreso", getDetalleIngresoByIngreso);

  // Upload route
  app.post("/api/upload", handleUpload);

  // Database routes - Bienes (tablas PAT reales)
  app.get("/api/bienes/ubicaciones", getUbicaciones);
  app.get("/api/bienes/stats", getStats);
  app.get("/api/bienes/bajas", getBajas); // Bienes dados de baja
  app.get("/api/bienes", getBienes);
  app.get("/api/bienes/:id", getBienById);
  app.post("/api/bienes", createBien);
  app.put("/api/bienes/:id", updateBien);
  app.delete("/api/bienes/:id", deleteBien);

  // Database routes - Usuarios (tablas PAT reales)
  app.post("/api/usuarios/login", loginUsuario);
  app.get("/api/usuarios/me", getCurrentUser);
  app.get("/api/usuarios", listUsuarios);
  app.get("/api/usuarios/:id", getUsuario);
  app.post("/api/usuarios", createUsuario);
  app.put("/api/usuarios/:id", updateUsuario);
  app.delete("/api/usuarios/:id", deleteUsuario);

  // SPA fallback - serve index.html for any non-API, non-file route
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
      return next();
    }
    // Skip static files (routes with file extensions like .js, .css, .png, etc.)
    if (req.path.match(/\.[^/]+$/)) {
      return next();
    }
    res.sendFile(path.join(process.cwd(), "dist", "spa", "index.html"));
  });

  return app;
}
