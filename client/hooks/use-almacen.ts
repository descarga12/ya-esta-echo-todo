import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, getApiHeaders } from "../lib/api-config";

export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  costo_unit: number;
  stock: number;
  unidad: string;
  registrado_nombre?: string;
}

export function useAlmacen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/productos`, { headers: getApiHeaders() });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al cargar productos (${res.status}): ${text.slice(0, 50)}`);
      }
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const add = async (item: Partial<Product>) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/productos`, {
        method: "POST",
        headers: {
          ...getApiHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear producto");
      }
      await fetchData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const update = async (id: number, patch: Partial<Product>) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
        method: "PUT",
        headers: {
          ...getApiHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar producto");
      }
      await fetchData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const remove = async (id: number) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
        method: "DELETE",
        headers: getApiHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar producto");
      }
      await fetchData();
      return true;
    } catch (err: any) {
      setError(err.message.trim());
      return false;
    }
  };

  return {
    products,
    loading,
    error,
    add,
    update,
    remove,
    refresh: fetchData,
  };
}
