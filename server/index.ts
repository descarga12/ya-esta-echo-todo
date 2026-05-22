import "dotenv/config";
import express from "express";
import compression from "compression";
import cors from "cors";
import path from "path";
import { createApiRouter } from "./routes/api-router";

/**
 * SERVIDOR EXPRESS PRINCIPAL
 * Este archivo configura el núcleo del backend de la aplicación.
 * Define middlewares globales, manejo de CORS, compresión y rutas de la API.
 */
export function createServer() {
  const app = express();

  // Middleware de compresión: reduce el tamaño de las respuestas HTTP
  app.use(
    compression({
      level: 9, // Máximo nivel de compresión
      threshold: 256, // Solo comprime respuestas mayores a 256 bytes
    })
  );

  /**
   * CONFIGURACIÓN DE CORS (Cross-Origin Resource Sharing)
   * Permite que la app frontend (Capacitor, localhost o Ngrok) se comunique con esta API.
   */
  app.use(cors({
    origin: (origin, cb) => {
      // Permite peticiones sin origen (como curl o apps móviles nativas)
      if (!origin) return cb(null, true);

      // Lista de orígenes permitidos (Local, Red local, Capacitor y Ngrok)
      const isLocal =
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("http://10.") ||
        origin.startsWith("http://100.") ||
        origin.startsWith("http://192.168.") ||
        origin.startsWith("http://172.16.") ||
        origin.startsWith("http://172.17.") ||
        origin.startsWith("http://172.18.") ||
        origin.startsWith("http://172.19.") ||
        origin.startsWith("http://172.2") ||
        origin.startsWith("http://172.3");

      const isCapacitor = origin.startsWith("capacitor://localhost") || origin.startsWith("ionic://localhost") || origin.startsWith("http://localhost");
      const isNgrok = origin.includes(".ngrok-free.app") || origin.includes(".ngrok-free.dev") || origin.includes(".ngrok.io");

      if (isLocal || isCapacitor || isNgrok) return cb(null, true);
      
      console.warn(`[CORS] Origin rejected: ${origin}`);
      return cb(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
    credentials: true, // Permite envío de cookies y headers de autorización
  }));

  // Parseadores de cuerpo de petición (JSON y Formularios)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Directorio para archivos subidos por el usuario (con cache de 1 día)
  app.use(express.static(path.join(process.cwd(), "public"), {
    maxAge: '1d',
    immutable: true
  }));
  
  // Servir los archivos compilados del frontend (React SPA) con cache agresivo (1 año)
  // Vite genera hashes en los nombres de archivos, así que es seguro cachear agresivamente
  app.use(express.static(path.join(process.cwd(), "dist", "spa"), {
    maxAge: '1y',
    immutable: true,
    index: false // Evita servir index.html con cache largo
  }));

  // Asegurar que el Service Worker y el Manifest se sirvan sin cache agresivo para actualizaciones rápidas
  app.get(['/sw.js', '/manifest.webmanifest'], (req, res) => {
    res.sendFile(path.join(process.cwd(), "dist", "spa", req.path), {
      maxAge: '0'
    });
  });

  // Servir el index.html por separado SIN cache largo para que los usuarios siempre tengan la última versión
  app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), "dist", "spa", "index.html"), {
      maxAge: '0'
    });
  });

  // Montar las rutas de la API bajo el prefijo /api
  app.use("/api", createApiRouter());

  /**
   * MANEJO DE RUTAS SPA (Single Page Application)
   * Cualquier ruta que no sea de la API ni un archivo estático, 
   * devuelve el index.html para que React Router tome el control.
   */
  app.use((req, res, next) => {
    // Si es una ruta de API, continuar (si llegó aquí es un 404 de API)
    if (req.path === "/api" || req.path.startsWith("/api/")) {
      return next();
    }
    // Si la ruta parece un archivo (tiene extensión), continuar
    if (req.path.match(/\.[^/]+$/)) {
      return next();
    }
    // Enviar el archivo principal del frontend
    res.sendFile(path.join(process.cwd(), "dist", "spa", "index.html"));
  });

  return app;
}
