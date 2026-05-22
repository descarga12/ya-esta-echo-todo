import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";
import compression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

/**
 * CONFIGURACIÓN DE VITE
 * Este archivo define cómo se compila y sirve la aplicación tanto en desarrollo como en producción.
 */
export default defineConfig(({ mode }) => ({
  // Configuración del servidor de desarrollo
  server: {
    host: "0.0.0.0", // Permite acceso desde otros dispositivos en la red
    port: 3000,
    allowedHosts: true,
    fs: {
      allow: ["./client", "./shared", "./server"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
  },
  
  // Optimización de la construcción (Minificación)
  esbuild: {
    // Elimina console.log y debugger en producción para que la app sea más rápida y privada
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // Mantiene los nombres de las funciones para evitar errores de ejecución
    keepNames: true,
  },

  build: {
    outDir: "dist/spa", // Directorio de salida para la aplicación web
    emptyOutDir: true,
    assetsInlineLimit: 4096, // Convierte archivos pequeños a Base64 para ahorrar peticiones HTTP
    minify: "esbuild", // Algoritmo de compresión ultra rápido
    cssCodeSplit: true, // Separa el CSS por cada página para carga bajo demanda
    cssMinify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    modulePreload: {
      polyfill: true,
    },
    
    // Configuración avanzada de Rollup para dividir el código en "chunks"
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // Agrupa librerías pesadas en archivos separados para mejorar el rendimiento
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react'],
        }
      },
    },
  },

  plugins: [
    react(), // Soporte para React con el compilador SWC (muy rápido)
    expressPlugin(), // Integra el servidor backend Express con Vite
    
    // Configuración PWA para funcionamiento offline
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.png', 'robots.txt'],
      manifest: {
        name: 'QR Inventario DSFD',
        short_name: 'QR Inventario',
        description: 'Sistema de Gestión de Inventario con Códigos QR',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Cachear todos los recursos estáticos
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Cachear peticiones a la API para lectura offline
            urlPattern: /^https:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),

    // Compresión GZIP para archivos web (ahorra ancho de banda)
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      disable: mode === 'production' && !!process.env.CAPACITOR_BUILD
    }),
    
    // Compresión BROTLI (más eficiente que GZIP para navegadores modernos)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      disable: mode === 'production' && !!process.env.CAPACITOR_BUILD
    })
  ],

  // Alias para rutas cortas (usar @/ en lugar de ../../../)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

/**
 * PLUGIN PERSONALIZADO PARA EXPRESS
 * Permite que el backend de Express funcione dentro del mismo proceso que Vite en desarrollo.
 */
function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Solo se aplica en modo desarrollo
    configureServer(server) {
      const app = createServer();
      // Inyecta Express como middleware en el servidor de Vite
      server.middlewares.use(app);
    },
  };
}
