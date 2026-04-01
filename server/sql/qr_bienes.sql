-- Tabla para el inventario QR
CREATE TABLE IF NOT EXISTS qr_bienes (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL UNIQUE,
  cantidad INT DEFAULT 0,
  ubicacion VARCHAR(255),
  foto VARCHAR(500),
  qr_code TEXT,
  registrado_por VARCHAR(100),
  registrado_nombre VARCHAR(255),
  registrado_unidad VARCHAR(255),
  registrado_cargo VARCHAR(255),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sku (sku),
  INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
