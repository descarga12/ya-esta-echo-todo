# 🔧 SOLUCIÓN DE PROBLEMAS - MySQL y Servidor API

## ❌ Problemas Detectados

1. **MySQL no responde** en puerto 3306
2. **Servidor API no está corriendo** en puerto 3000/8080

---

## 🚀 SOLUCIÓN PASO A PASO

### PASO 1: Iniciar MySQL (Laragon)

1. **Abre Laragon** (debe estar en la bandeja del sistema o escritorio)
2. **Haz clic derecho** en el icono de Laragon → **"Start All"** o **"MySQL → Start MySQL"**
3. **Verifica** que el servicio esté activo (icono verde)

#### Verificación en Navicat:
1. Abre Navicat
2. Haz clic en **"Test Connection"** en tu perfil "local"
3. Debe decir **"Connection Successful"**

---

### PASO 2: Crear/Verificar el archivo .env

Ejecuta en terminal (CMD o PowerShell) dentro de la carpeta del proyecto:

```bash
# Si no existe .env, créalo desde el ejemplo
copy .env.example .env

# O edítalo directamente
notepad .env
```

**Contenido que debe tener** `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=prueba
```

> Nota: `DB_PASS` debe estar vacío según tu configuración de Navicat

---

### PASO 3: Instalar dependencias (si no están instaladas)

```bash
pnpm install
```

O si prefieres npm:
```bash
npm install
```

---

### PASO 4: Importar la base de datos (si es necesario)

Si la base de datos "prueba" no existe:

```bash
# Opción 1: Usando Laragon MySQL
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root -e "CREATE DATABASE prueba;"

# Opción 2: Importar el dump completo
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root prueba < prueba.sql
```

---

### PASO 5: Iniciar el Servidor API

```bash
pnpm dev
```

Verás algo como:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://10.10.10.13:3000/
  ➜  press h + enter to show help
```

---

### PASO 6: Verificar que todo funciona

Abre tu navegador y prueba:

1. **API Info**: http://localhost:3000/api
2. **Ping**: http://localhost:3000/api/ping
3. **Bienes**: http://localhost:3000/api/bienes
4. **Login** (con curl o Postman):
   ```bash
   curl -X POST http://localhost:3000/api/usuarios/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```

---

## 🛠️ ARCHIVOS BATCH CREADOS

He creado estos archivos para facilitar el proceso:

### 1. `diagnostic.bat`
**Ejecuta este primero** para ver el estado de todo:
```bash
diagnostic.bat
```

Muestra:
- ✅ Si MySQL está corriendo
- ✅ Si la base de datos existe
- ✅ Si el servidor API está activo
- ✅ Si node_modules existe
- ✅ Si el archivo .env existe

### 2. `setup-env.bat`
Crea/configura el archivo `.env`:
```bash
setup-env.bat
```

### 3. `start-server.bat`
Inicia el servidor de desarrollo:
```bash
start-server.bat
```

---

## 📝 CONFIGURACIÓN DE LA APP MÓVIL

Una vez que el servidor esté corriendo, la app móvil necesita saber dónde conectarse.

**Configuración actual** (`client/lib/api-config.ts`):
```typescript
const SERVER_IP = "10.10.10.13";  // Tu IP de red local
const PORT = "3000";
```

**Para cambiar la IP** (si es diferente):
1. Edita `client/lib/api-config.ts`
2. Cambia `SERVER_IP` por tu IP actual
3. Reconstruye la app: `pnpm build && pnpm cap:sync:android`

**Para usar ngrok** (acceso remoto):
1. Ejecuta: `ngrok http 3000`
2. Copia la URL https generada
3. Pégala en `TUNNEL_URL` en `api-config.ts`
4. O configúrala dinámicamente en la app (Login → Configuración)

---

## 🔍 VERIFICACIÓN RÁPIDA

Ejecuta estos comandos en **CMD o PowerShell**:

```bash
# 1. Verificar MySQL
netstat -an | findstr :3306

# 2. Verificar Servidor API
netstat -an | findstr :3000

# 3. Probar API
curl http://localhost:3000/api/ping

# 4. Probar login
curl -X POST http://localhost:3000/api/usuarios/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

---

## ⚠️ ERRORES COMUNES

### "ECONNREFUSED" al conectar a MySQL
**Solución**: Iniciar Laragon → Start MySQL

### "Cannot find module" al ejecutar pnpm dev
**Solución**: Ejecutar `pnpm install`

### "Database prueba does not exist"
**Solución**: 
```bash
mysql -u root -e "CREATE DATABASE prueba;"
mysql -u root prueba < prueba.sql
```

### "Port 3000 is already in use"
**Solución**: 
```bash
# Buscar y matar proceso en puerto 3000
netstat -ano | findstr :3000
taskkill /PID <NUMERO_PID> /F
```

---

## ✅ CHECKLIST FINAL

Antes de usar la app, verifica:

- [ ] Laragon está iniciado con MySQL activo
- [ ] Base de datos "prueba" existe
- [ ] Archivo `.env` configurado correctamente
- [ ] Servidor API corriendo (`pnpm dev`)
- [ ] API responde en http://localhost:3000/api/ping
- [ ] Login funciona con admin/admin123
- [ ] App móvil tiene la IP correcta configurada

---

## 📞 COMANDOS DE AYUDA

```bash
# Iniciar todo
pnpm dev

# Solo base de datos (si necesitas acceso directo)
"C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe" -u root prueba

# Compilar para producción
pnpm build

# Sincronizar con Android
pnpm cap:sync:android
```

---

**¿Tienes algún error específico? Mándame el mensaje de error y te ayudo a solucionarlo.**
