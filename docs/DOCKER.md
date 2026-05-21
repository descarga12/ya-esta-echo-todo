# Guía de Uso con Docker 🐳

Esta guía explica cómo ejecutar todo el ecosistema de la aplicación (Base de Datos + Servidor + Frontend) utilizando Docker y Docker Compose.

## 🚀 Inicio Rápido

Para levantar todo el sistema por primera vez:

1.  Asegúrate de tener **Docker Desktop** instalado y corriendo.
2.  Abre una terminal en la raíz del proyecto.
3.  Ejecuta el siguiente comando:
    ```bash
    docker-compose up -d --build
    ```

Esto hará lo siguiente:
- Descargará y configurará una base de datos **MySQL 8.0**.
- Construirá la imagen de la aplicación (compilando el frontend y el servidor).
- Levantará ambos servicios y los conectará automáticamente.

## 🛠️ Servicios Disponibles

- **Frontend + API**: `http://localhost:3000`
- **Base de Datos (MySQL)**: Acceso externo en `localhost:3307` (Usuario: `user_inventory`, Password: `user_password`).

## 📋 Comandos Útiles

| Acción | Comando |
| :--- | :--- |
| Ver logs en tiempo real | `docker-compose logs -f` |
| Detener los servicios | `docker-compose stop` |
| Detener y borrar contenedores | `docker-compose down` |
| Reconstruir la app tras cambios | `docker-compose up -d --build app` |
| Ver estado de los servicios | `docker-compose ps` |

## 📁 Persistencia de Datos

- **Imágenes**: Las fotos que subas a la app se guardan en la carpeta local `public/uploads` mediante un volumen compartido.
- **Base de Datos**: Los datos de MySQL se guardan en un volumen interno de Docker llamado `db_data` para que no se borren al apagar los contenedores.

## ⚠️ Notas Importantes
- Si usas Docker, **no necesitas Laragon** encendido, ya que Docker incluye su propia base de datos.
- El puerto de MySQL para herramientas externas (como DBeaver o Workbench) es el **3307**.
