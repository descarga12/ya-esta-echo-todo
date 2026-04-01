import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { getCategorias, getCategoriaById } from "./routes/categorias";
import { getComprobantes, getComprobanteById } from "./routes/comprobantes";
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
} from "./routes/bienes";
import {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  loginUsuario,
  getCurrentUser,
} from "./routes/usuarios";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
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

  // Database routes - Categorías
  app.get("/api/categorias", getCategorias);
  app.get("/api/categorias/:id", getCategoriaById);

  // Database routes - Comprobantes
  app.get("/api/comprobantes", getComprobantes);
  app.get("/api/comprobantes/:id", getComprobanteById);

  // Database routes - Detalle Ingreso
  app.get("/api/ingreso", getDetalleIngreso);
  app.get("/api/ingreso/:idingreso", getDetalleIngresoByIngreso);

  // Upload route
  app.post("/api/upload", handleUpload);

  // Database routes - Bienes
  app.get("/api/bienes", getBienes);
  app.get("/api/bienes/:id", getBienById);
  app.post("/api/bienes", createBien);
  app.put("/api/bienes/:id", updateBien);
  app.delete("/api/bienes/:id", deleteBien);

  // Database routes - Usuarios
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
