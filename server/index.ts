import "dotenv/config";
import express from "express";
import compression from "compression";
import cors from "cors";
import path from "path";
import { createApiRouter } from "./routes/api-router";

/**
 * Construye la app Express con:
 * - middlewares globales (CORS, body parser, estáticos)
 * - rutas API
 * - fallback SPA para React Router
 */
export function createServer() {
  const app = express();

  app.use(
    compression({
      level: 9,
      threshold: 256,
    })
  );

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
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), "public")));
  // Serve SPA static files from dist/spa
  app.use(express.static(path.join(process.cwd(), "dist", "spa")));

  app.use("/api", createApiRouter());

  // SPA fallback - serve index.html for any non-API, non-file route
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path === "/api" || req.path.startsWith("/api/")) {
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
