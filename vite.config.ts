import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";
import compression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    fs: {
      allow: ["./client", "./shared", "./server"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**"],
    },
  },
  build: {
    outDir: "dist/spa",
    emptyOutDir: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug", "console.warn"],
        passes: 3,
        toplevel: true,
        dead_code: true,
        unused: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    cssCodeSplit: true,
    cssMinify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules") || id.includes(".pnpm")) {
            const name = id.toString();
            if (name.includes("react") || name.includes("scheduler") || name.includes("react-dom") || name.includes("react-router")) return "vendor-react";
            if (name.includes("radix-ui")) return "vendor-radix";
            if (name.includes("tanstack")) return "vendor-query";
            if (name.includes("lucide")) return "vendor-ui";
            if (name.includes("recharts") || name.includes("d3")) return "vendor-charts";
            if (name.includes("jspdf") || name.includes("canvg") || name.includes("html2canvas")) return "vendor-pdf";
            if (name.includes("html5-qrcode")) return "vendor-qr";
            if (name.includes("date-fns")) return "vendor-date";
            if (name.includes("zod")) return "vendor-zod";
            if (name.includes("embla-carousel") || name.includes("vaul") || name.includes("cmdk")) return "vendor-components";
            return "vendor-misc";
          }
        },
      },
    },
  },
  plugins: [
    react(), 
    expressPlugin(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
