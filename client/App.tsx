import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MainLayout from "@/components/layout/MainLayout";
import Reportes from "@/pages/Reportes";
import Item from "@/pages/Item";
import Login from "@/pages/Login";
import Users from "@/pages/Users";
import Account from "@/pages/Account";
import Almacen from "@/pages/Almacen";
import { AuthProvider } from "@/lib/auth-context";
import { ProtectedRoute } from "@/lib/ProtectedRoute";

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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

