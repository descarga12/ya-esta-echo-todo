# Conectar la app a un servidor MySQL (manual)

Este documento explica paso a paso cómo conectar la aplicación "QR Inventario" a una base de datos MySQL, añadir el campo status en los artículos, prevenir duplicados por SKU y migrar datos desde localStorage.

---

## 1) Requisitos previos

- Tener acceso a un servidor MySQL (local o remoto). Ejemplos de proveedores: PlanetScale, Amazon RDS, DigitalOcean, Railway.
- Node.js y pnpm (o npm) instalados en la máquina donde se desarrolla/despliega.
- Acceso al repositorio del proyecto y permisos para editar el servidor (carpeta `server/`).

---

## 2) Crear base de datos y usuario

Conéctate como administrador a MySQL y ejecuta:

```sql
CREATE DATABASE qr_inventory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'qr_user'@'%' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON qr_inventory.* TO 'qr_user'@'%';
FLUSH PRIVILEGES;
```

Anota: host, puerto (3306), usuario y contraseña.

---

## 3) Esquema de tabla (items)

Ejecuta en la base de datos `qr_inventory`:

```sql
CREATE TABLE items (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(128) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  location VARCHAR(255),
  qr TEXT,
  registeredBy VARCHAR(128),
  registeredName VARCHAR(255),
  registeredUnidad VARCHAR(255),
  registeredCargo VARCHAR(255),
  status ENUM('active','disabled','pending') NOT NULL DEFAULT 'active',
  updatedAt BIGINT NOT NULL,
  createdAt BIGINT NOT NULL,
  UNIQUE KEY uq_items_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- La columna `status` es el estado del objeto (InventoryItem).
- La restricción UNIQUE en `sku` evita duplicados en la DB.

---

## 4) Instalar dependencias del servidor

En la raíz del proyecto ejecuta:

```bash
pnpm add mysql2 dotenv
# o con npm: npm install mysql2 dotenv
```

---

## 5) Variables de entorno

Crea un archivo `.env` en la raíz (no lo subas al repo):

```
DB_HOST=mi-host-db.example.com
DB_PORT=3306
DB_USER=qr_user
DB_PASS=your_strong_password_here
DB_NAME=qr_inventory
```

En producción, configura estas variables en el entorno de tu proveedor (Netlify/Vercel/Railway, etc.).

---

## 6) Módulo de conexión (server/lib/db.ts)

Crea `server/lib/db.ts` con este contenido:

```ts
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
```

---

## 7) Rutas API básicas (server/routes/items.ts)

Crea `server/routes/items.ts` y registra en `server/index.ts`:

```ts
import { RequestHandler } from "express";
import pool from "../lib/db.js";
import crypto from "crypto";

export const listItems: RequestHandler = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM items ORDER BY updatedAt DESC",
  );
  res.json(rows);
};

export const createItem: RequestHandler = async (req, res) => {
  const {
    name,
    sku,
    quantity = 1,
    location,
    qr,
    registeredBy,
    registeredName,
    registeredUnidad,
    registeredCargo,
    status = "active",
  } = req.body;
  if (!sku) return res.status(400).json({ message: "sku required" });
  const id = crypto.randomUUID();
  const ts = Date.now();
  try {
    await pool.query(
      `INSERT INTO items (id,name,sku,quantity,location,qr,registeredBy,registeredName,registeredUnidad,registeredCargo,status,updatedAt,createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name || "",
        sku,
        Number(quantity),
        location || null,
        qr || null,
        registeredBy || null,
        registeredName || null,
        registeredUnidad || null,
        registeredCargo || null,
        status,
        ts,
        ts,
      ],
    );
    const [[row]] = await pool.query("SELECT * FROM items WHERE id = ?", [id]);
    res.status(201).json(row);
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "SKU ya existe" });
    }
    console.error(err);
    res.status(500).json({ message: "Error interno" });
  }
};

export const updateItem: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const patch = req.body;
  if (!id) return res.status(400).json({ message: "id required" });
  try {
    const fields = Object.keys(patch);
    if (fields.length === 0)
      return res.status(400).json({ message: "no fields" });
    const values = fields.map((f) => (patch as any)[f]);
    const setClause = fields.map((f) => `${f} = ?`).join(", ");
    values.push(Date.now());
    values.push(id);
    await pool.query(
      `UPDATE items SET ${setClause}, updatedAt = ? WHERE id = ?`,
      values,
    );
    const [[row]] = await pool.query("SELECT * FROM items WHERE id = ?", [id]);
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error interno" });
  }
};
```

En `server/index.ts` (o el archivo que inicializa Express) registra:

```ts
import { listItems, createItem, updateItem } from "./routes/items";
app.get("/api/items", listItems);
app.post("/api/items", createItem);
app.patch("/api/items/:id", updateItem);
```

---

## 8) Cambios en el cliente (client/pages/Index.tsx)

Reemplaza las lecturas/escrituras directas a `localStorage` por llamadas a la API:

- Listar items:

```ts
const res = await fetch("/api/items");
const items = await res.json();
```

- Crear item (ejecutado desde el formulario/submit):

```ts
await fetch("/api/items", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});
```

- Actualizar item:

```ts
await fetch(`/api/items/${id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(patch),
});
```

Ajusta `useInventory()` para cargar al montar y para llamar a estos endpoints en `add`/`update`.

---

## 9) Migración desde localStorage (opcional)

Si tienes datos en localStorage puedes exportarlos y migrar con un script Node:

```js
// scripts/migrateLocalToDb.js
import pool from "../server/lib/db.js";
import crypto from "crypto";
const raw = JSON.parse(/* pega aquí el JSON exportado de localStorage */);
for (const it of raw) {
  try {
    const id = it.id || crypto.randomUUID();
    const ts = Date.now();
    await pool.query(
      `INSERT INTO items (id,name,sku,quantity,location,qr,registeredBy,registeredName,registeredUnidad,registeredCargo,status,updatedAt,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        it.name || "",
        it.sku || "",
        it.quantity || 1,
        it.location || null,
        it.qr || null,
        it.registeredBy || null,
        it.registeredName || null,
        it.registeredUnidad || null,
        it.registeredCargo || null,
        it.status || "active",
        it.updatedAt || ts,
        it.createdAt || ts,
      ],
    );
  } catch (e) {
    if (e?.code === "ER_DUP_ENTRY") continue; // ya existe sku
    console.error("error migrating", e);
  }
}
process.exit(0);
```

---

## 10) Buenas prácticas y seguridad

- No expongas credenciales en el frontend ni en el repo. Usa variables de entorno.
- Habilita TLS en la conexión a la DB si es remota.
- Valida/sanitiza entradas en el servidor.
- Control de acceso: valida roles (admin/registrar) en endpoints que muten datos.
- Maneja y reporta errores de forma clara en client (toasts) y en server (logs).

---

## 11) Alternativa con Prisma (recomendada para migraciones/typed)

- Instala: `pnpm add @prisma/client` y `pnpm add -D prisma`.
- `npx prisma init` y configura el `DATABASE_URL` en `.env` con la cadena MySQL.
- Define el modelo `Item` en `prisma/schema.prisma` (incluyendo `@unique` en sku y `status` como enum).
- Ejecuta `npx prisma migrate dev --name init`.

Prisma simplifica migraciones, consultas tipadas y evita SQL manual.

---

## 12) Despliegue y MCPs disponibles

Proveedores e integraciones que puedes usar desde Builder.io MCP o plataformas de hosting:

• Supabase — base de datos y autenticación (preferido para BaaS)
• Neon — serverless Postgres
• Netlify — hosting / despliegues
• Zapier — automatizaciones
• Figma — diseño (plugin)
• Builder CMS (Builder.io) — gestión de contenido
• Linear — gestión de issues
• Notion — documentación
• Sentry — monitorización de errores
• Context7 — documentación técnica
• Semgrep — escaneo de seguridad (SAST)
• Prisma Postgres — ORM / administración de Postgres
• Convex — realtime backend
• HubSpot — CRM

Para conectar MCPs desde este entorno, haz clic en: [Open MCP popover](#open-mcp-popover)

**Sugerencia:** Para bases de datos, si no quieres gestionar MySQL manualmente, considera Supabase (Postgres) y Prisma para migraciones y respaldo de schema.

---

## 13) Resumen de comandos rápidos

```bash
pnpm add mysql2 dotenv
# ejecutar SQL para crear DB y tabla
# crear .env con variables DB_*
# agregar archivos server/lib/db.ts y server/routes/items.ts
pnpm dev
```

---

Si quieres, genero ahora los archivos de servidor (`server/lib/db.ts` y `server/routes/items.ts`) y un ejemplo de `useInventory()` modificado en `client/pages/Index.tsx`. Indica si lo hago ahora.
