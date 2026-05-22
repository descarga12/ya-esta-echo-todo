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

const ALMACEN_CACHE_KEY = "almacen.cache.v1";
const ALMACEN_QUEUE_KEY = "almacen.queue.v1";

type OfflineOperation =
  | { type: "add"; payload: Partial<Product> }
  | { type: "update"; id: number; payload: Partial<Product> }
  | { type: "remove"; id: number };

function readCachedProducts(): Product[] {
  try {
    const raw = localStorage.getItem(ALMACEN_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedProducts(items: Product[]) {
  localStorage.setItem(ALMACEN_CACHE_KEY, JSON.stringify(items));
}

function readQueue(): OfflineOperation[] {
  try {
    const raw = localStorage.getItem(ALMACEN_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineOperation[]) {
  localStorage.setItem(ALMACEN_QUEUE_KEY, JSON.stringify(queue));
}

export function useAlmacen() {
  const [products, setProducts] = useState<Product[]>(() => readCachedProducts());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/productos`, { headers: getApiHeaders() });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al cargar productos (${res.status}): ${text.slice(0, 50)}`);
      }
      const data = await res.json();
      const normalized = Array.isArray(data) ? data : [];
      setProducts(normalized);
      writeCachedProducts(normalized);
    } catch (err: any) {
      const cached = readCachedProducts();
      if (cached.length > 0) {
        setProducts(cached);
        setError("Sin conexión: mostrando datos guardados localmente.");
      } else {
        setError(err.message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const flushQueue = useCallback(async () => {
    const queue = readQueue();
    if (!queue.length) return;

    const pending: OfflineOperation[] = [];
    for (const op of queue) {
      try {
        if (op.type === "add") {
          await fetch(`${API_BASE_URL}/api/productos`, {
            method: "POST",
            headers: { ...getApiHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify(op.payload),
          });
        } else if (op.type === "update") {
          await fetch(`${API_BASE_URL}/api/productos/${op.id}`, {
            method: "PUT",
            headers: { ...getApiHeaders(), "Content-Type": "application/json" },
            body: JSON.stringify(op.payload),
          });
        } else if (op.type === "remove") {
          await fetch(`${API_BASE_URL}/api/productos/${op.id}`, {
            method: "DELETE",
            headers: getApiHeaders(),
          });
        }
      } catch {
        pending.push(op);
      }
    }
    writeQueue(pending);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      await flushQueue().catch(() => undefined);
      if (cancelled) return;
      const hadCache = readCachedProducts().length > 0;
      await fetchData(hadCache);
    };
    void boot();
    return () => { cancelled = true; };
  }, [fetchData, flushQueue]);

  const add = async (item: Partial<Product>) => {
    setError(null);
    const localItem: Product = {
      id: Date.now(), // ID temporal
      codigo: item.codigo || "",
      nombre: item.nombre || "",
      descripcion: item.descripcion || "",
      costo_unit: item.costo_unit || 0,
      stock: item.stock || 0,
      unidad: item.unidad || "UND",
    };
    const optimistic = [localItem, ...products];
    setProducts(optimistic);
    writeCachedProducts(optimistic);

    try {
      const res = await fetch(`${API_BASE_URL}/api/productos`, {
        method: "POST",
        headers: { ...getApiHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear producto");
      }
      await flushQueue();
      await fetchData(true);
      return true;
    } catch (err: any) {
      const queue = readQueue();
      queue.push({ type: "add", payload: item });
      writeQueue(queue);
      setError("Sin conexión: producto guardado localmente.");
      return true;
    }
  };

  const update = async (id: number, patch: Partial<Product>) => {
    setError(null);
    const optimistic = products.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setProducts(optimistic);
    writeCachedProducts(optimistic);

    try {
      const res = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
        method: "PUT",
        headers: { ...getApiHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar producto");
      }
      await flushQueue();
      await fetchData(true);
      return true;
    } catch (err: any) {
      const queue = readQueue();
      queue.push({ type: "update", id, payload: patch });
      writeQueue(queue);
      setError("Sin conexión: cambios guardados localmente.");
      return true;
    }
  };

  const remove = async (id: number) => {
    setError(null);
    const optimistic = products.filter((p) => p.id !== id);
    setProducts(optimistic);
    writeCachedProducts(optimistic);

    try {
      const res = await fetch(`${API_BASE_URL}/api/productos/${id}`, {
        method: "DELETE",
        headers: getApiHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar producto");
      }
      await flushQueue();
      await fetchData(true);
      return true;
    } catch (err: any) {
      const queue = readQueue();
      queue.push({ type: "remove", id });
      writeQueue(queue);
      setError("Sin conexión: eliminación pendiente.");
      return true;
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
