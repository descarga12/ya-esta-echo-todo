import "./global.css";

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/ProtectedRoute";

/**
 * CARGA DIFERIDA (Lazy Loading)
 * Cargamos las páginas solo cuando el usuario navega a ellas.
 * Esto reduce significativamente el tamaño del archivo JavaScript inicial.
 */
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Item = lazy(() => import("./pages/Item"));
const Login = lazy(() => import("./pages/Login"));
const Users = lazy(() => import("./pages/Users"));
const Account = lazy(() => import("./pages/Account"));
const Almacen = lazy(() => import("./pages/Almacen"));

// Cliente para manejar peticiones y caché de datos con React Query
const queryClient = new QueryClient();

/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN
 * Aquí se configuran todos los proveedores de contexto (Autenticación, UI, Consultas)
 * y se define la estructura de navegación.
 */
const App = () => (
  // QueryClientProvider: Maneja el estado de las peticiones a la API
  <QueryClientProvider client={queryClient}>
    {/* AuthProvider: Maneja el estado global del usuario y el login */}
    <AuthProvider>
      {/* TooltipProvider: Habilita los globos de ayuda en la interfaz */}
      <TooltipProvider>
        {/* Componentes de notificaciones (Toasts) */}
        <Toaster />
        <Sonner />
        
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          {/* Suspense: Muestra un cargando mientras se descargan los módulos de las páginas */}
          <Suspense
            fallback={
              <div className="min-h-screen grid place-items-center text-sm text-slate-400 font-medium">
                Cargando modulo...
              </div>
            }
          >
            <Routes>
              {/* Ruta pública: Login */}
              <Route path="/login" element={<Login />} />
              
              {/* Rutas Protegidas: Requieren que el usuario esté autenticado */}
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
                
                {/* 404 - Página no encontrada */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Renderizado de la aplicación en el elemento HTML con id 'root'
createRoot(document.getElementById("root")!).render(<App />);
