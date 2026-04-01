import { useState, useEffect, useCallback } from "react";

export interface Bien {
  id: string;
  nombre: string;
  sku: string;
  cantidad: number;
  ubicacion?: string;
  foto?: string;
  qr_code?: string;
  registrado_por?: string;
  registrado_nombre?: string;
  registrado_unidad?: string;
  registrado_cargo?: string;
  fecha_registro?: string;
  fecha_actualizacion?: string;
}

export interface BienInput {
  id?: string;
  nombre: string;
  sku: string;
  cantidad?: number;
  ubicacion?: string;
  foto?: string;
  qr_code?: string;
  registrado_por?: string;
  registrado_nombre?: string;
  registrado_unidad?: string;
  registrado_cargo?: string;
}

export function useBienes() {
  const [items, setItems] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBienes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bienes");
      if (!res.ok) throw new Error("Error al cargar bienes");
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBienes();
  }, [fetchBienes]);

  const add = async (item: BienInput) => {
    setError(null);
    try {
      const res = await fetch("/api/bienes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear bien");
      }
      await fetchBienes();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const update = async (id: string, patch: Partial<BienInput>) => {
    setError(null);
    try {
      const res = await fetch(`/api/bienes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar bien");
      }
      await fetchBienes();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/bienes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar bien");
      }
      await fetchBienes();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  return {
    items,
    loading,
    error,
    add,
    update,
    remove,
    refresh: fetchBienes,
  };
}
