import "./global.css";

import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/ProtectedRoute";

// Carga diferida por ruta para reducir el JS inicial.
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Reportes = lazy(() => import("./pages/Reportes"));
const Item = lazy(() => import("./pages/Item"));
const Login = lazy(() => import("./pages/Login"));
const Users = lazy(() => import("./pages/Users"));
const Account = lazy(() => import("./pages/Account"));
const Almacen = lazy(() => import("./pages/Almacen"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Suspense
            fallback={
              <div className="min-h-screen grid place-items-center text-sm text-slate-400">
                Cargando modulo...
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<Login />} />
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
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

