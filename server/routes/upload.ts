import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * ============================================
 * API DE SUBIDA DE IMÁGENES
 * ============================================
 * 
 * Este módulo maneja la subida de archivos de imagen
 * al servidor usando multer. Las imágenes se almacenan
 * en la carpeta public/uploads/.
 * 
 * Características:
 * - Límite de tamaño: 10MB
 * - Solo archivos de imagen (image/*)
 * - Nombres de archivo únicos con timestamp
 */

// Crear directorio de uploads si no existe
const uploadDir = path.join(process.cwd(), "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configuración de almacenamiento de multer.
 * Define la carpeta destino y el nombre del archivo.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-aleatorio-nombreoriginal
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

/**
 * Middleware de multer configurado con límites y filtros.
 */
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Límite: 10MB
  },
  fileFilter: (req, file, cb) => {
    // Solo permitir archivos de imagen
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

/**
 * Handler para procesar la subida de imágenes.
 * 
 * Endpoint: POST /api/upload
 * 
 * Valida:
 * - Tamaño máximo de archivo (10MB)
 * - Tipo de archivo (solo imágenes)
 * - Existencia de archivo en la petición
 * 
 * @returns Objeto con URL del archivo subido y metadatos
 */
export const handleUpload: RequestHandler = (req, res) => {
  const uploadMiddleware = upload.single("file");

  uploadMiddleware(req, res, (err) => {
    // Manejar errores de multer
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Archivo demasiado grande (máximo 10MB)" });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Validar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({ error: "No se subió un archivo" });
    }

    // Validar tipo de archivo
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Solo se permiten archivos de imagen" });
    }

    // Generar URL de acceso al archivo
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // Devolver respuesta exitosa con metadatos
    res.json({
      success: true,
      filename: req.file.filename,
      url: fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  });
};
