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
const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_CACHE_KEY = "auth_user_cache";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay sesión activa al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const cachedUser = localStorage.getItem(AUTH_USER_CACHE_KEY);
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch {
            localStorage.removeItem(AUTH_USER_CACHE_KEY);
          }
        }

        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/usuarios/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(userData));
          } else {
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_USER_CACHE_KEY);
            setUser(null);
          }
        }
      } catch (error) {
        // Offline mode: keep cached session if available.
        console.warn("Auth check skipped (offline mode):", error);
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
        let errorMsg = "Error al iniciar sesión";
        try {
          const error = await response.json();
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = `Error del servidor (${response.status})`;
        }
        throw new Error(errorMsg);
      }

      const { token, user: userData } = await response.json();
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || "Error al iniciar sesión");
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_CACHE_KEY);
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
