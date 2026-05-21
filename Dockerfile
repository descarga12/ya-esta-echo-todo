# Etapa 1: Construcción (Build)
FROM node:22-slim AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar todas las dependencias
RUN pnpm install

# Copiar el resto del código
COPY . .

# Construir el frontend y el servidor
RUN pnpm build:client
RUN pnpm build:server

# Etapa 2: Ejecución (Runtime)
FROM node:22-slim

WORKDIR /app

# Instalar solo pnpm para dependencias de producción si fuera necesario
RUN npm install -g pnpm

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/public ./public

# Instalar solo dependencias de producción
RUN pnpm install --prod

# Exponer el puerto de la app
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar la aplicación
CMD ["node", "dist/server/node-build.mjs"]
