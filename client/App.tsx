import "./global.css";

import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/ProtectedRoute";
import { WifiOff, RefreshCw } from "lucide-react";
import { registerSW } from 'virtual:pwa-register';
import { toast } from "sonner";

/**
 * CONFIGURACIÓN DE PWA Y OFFLINE
 * Registra el service worker y maneja las actualizaciones automáticas.
 */
const updateSW = registerSW({
  onNeedRefresh() {
    toast("Nueva versión disponible", {
      description: "La aplicación se ha actualizado. Haz clic para recargar.",
      action: {
        label: "Recargar",
        onClick: () => updateSW(true),
      },
      duration: Infinity,
    });
  },
  onOfflineReady() {
    toast.success("App lista para usar sin conexión");
  },
});

/**
 * COMPONENTE DE INDICADOR OFFLINE
 * Muestra un aviso cuando el usuario pierde la conexión a internet.
 */
const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Conexión restablecida", {
        description: "Los cambios pendientes se sincronizarán pronto."
      });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[100] bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-300">
      <WifiOff size={16} className="animate-pulse" />
      <span>Modo Offline: Guardando cambios localmente</span>
    </div>
  );
};

// Carga perezosa de páginas para optimizar el bundle inicial
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Item = lazy(() => import("./pages/Item"));
const Login = lazy(() => import("./pages/Login"));
const Users = lazy(() => import("./pages/Users"));
const Account = lazy(() => import("./pages/Account"));
const Almacen = lazy(() => import("./pages/Almacen"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutos de validez para la caché
    },
  },
});

/**
 * COMPONENTE PRINCIPAL
 * Configura los proveedores de contexto y la estructura de navegación.
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {/* Componentes de notificación global */}
        <Toaster />
        <Sonner position="top-right" richColors closeButton />
        <OfflineIndicator />
        
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Suspense
            fallback={
              <div className="min-h-screen grid place-items-center">
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="animate-spin text-primary w-8 h-8" />
                  <p className="text-sm text-slate-400 font-medium">Cargando aplicación...</p>
                </div>
              </div>
            }
          >
            <Routes>
              {/* Ruta de acceso pública */}
              <Route path="/login" element={<Login />} />
              
              {/* Rutas protegidas bajo el layout principal */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Index />} />
                <Route path="reportes" element={<Reportes />} />
                <Route path="almacen" element={<Almacen />} />
                <Route path="item/:id" element={<Item />} />
                <Route path="users" element={<Users />} />
                <Route path="account" element={<Account />} />
                
                {/* Manejo de rutas inexistentes */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Punto de entrada del renderizado de React
createRoot(document.getElementById("root")!).render(<App />);
