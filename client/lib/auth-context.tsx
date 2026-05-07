import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "./api-config";

export interface User {
  id?: number;
  username: string;
  nombre: string;
  unidad_organica: string;
  cargo: string;
  rol: "admin" | "registrar" | "viewer";
  estado?: number;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  canEdit: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión activa al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem("auth_token");
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al iniciar sesión");
      }

      const { token, user: userData } = await response.json();
      localStorage.setItem("auth_token", token);
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || "Error al iniciar sesión");
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const isAdmin = user?.rol === "admin";
  const canEdit = user?.rol === "admin" || user?.rol === "registrar";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        canEdit,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
