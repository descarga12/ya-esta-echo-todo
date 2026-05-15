import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, getApiHeaders } from "../lib/api-config";

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

/** Texto mostrado para quien registró el bien (nombre de API o fallbacks). */
export function displayRegistranteNombre(b: {
  registrado_nombre?: string;
  registrado_por?: string | number | null;
}): string {
  const n = (b.registrado_nombre || "").trim();
  if (n) return n;
  const id = b.registrado_por;
  if (id !== undefined && id !== null && String(id).trim() !== "") {
    return `Usuario ID ${id}`;
  }
  return "Sin registrar";
}

const BIENES_CACHE_KEY = "bienes.cache.v1";
const BIENES_QUEUE_KEY = "bienes.queue.v1";

type OfflineOperation =
  | { type: "add"; payload: BienInput }
  | { type: "update"; id: string; payload: Partial<BienInput> }
  | { type: "remove"; id: string };

function readCachedBienes(): Bien[] {
  try {
    const raw = localStorage.getItem(BIENES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedBienes(items: Bien[]) {
  localStorage.setItem(BIENES_CACHE_KEY, JSON.stringify(items));
}

function readQueue(): OfflineOperation[] {
  try {
    const raw = localStorage.getItem(BIENES_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineOperation[]) {
  localStorage.setItem(BIENES_QUEUE_KEY, JSON.stringify(queue));
}

export function useBienes() {
  const [items, setItems] = useState<Bien[]>(() => readCachedBienes());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBienes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bienes`, {
        headers: getApiHeaders()
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Error al cargar bienes (${res.status}): ${text.slice(0, 50)}`);
      }
      const data = await res.json();
      const normalized = Array.isArray(data) ? data : [];
      setItems(normalized);
      writeCachedBienes(normalized);
    } catch (err: any) {
      const cached = readCachedBienes();
      if (cached.length > 0) {
        setItems(cached);
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
          await fetch(`${API_BASE_URL}/api/bienes`, {
            method: "POST",
            headers: {
              ...getApiHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(op.payload),
          });
        } else if (op.type === "update") {
          await fetch(`${API_BASE_URL}/api/bienes/${op.id}`, {
            method: "PUT",
            headers: {
              ...getApiHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(op.payload),
          });
        } else if (op.type === "remove") {
          await fetch(`${API_BASE_URL}/api/bienes/${op.id}`, {
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
      const hadCache = readCachedBienes().length > 0;
      await fetchBienes(hadCache);
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [fetchBienes, flushQueue]);

  const add = async (item: BienInput) => {
    setError(null);
    const localItem: Bien = {
      id: item.id || item.sku,
      nombre: item.nombre,
      sku: item.sku,
      cantidad: item.cantidad ?? 1,
      ubicacion: item.ubicacion,
      foto: item.foto,
      qr_code: item.qr_code,
      registrado_por: item.registrado_por,
      registrado_nombre: item.registrado_nombre,
      registrado_unidad: item.registrado_unidad,
      registrado_cargo: item.registrado_cargo,
    };
    const optimistic = [localItem, ...items.filter((it) => it.id !== localItem.id)];
    setItems(optimistic);
    writeCachedBienes(optimistic);

    try {
      const res = await fetch(`${API_BASE_URL}/api/bienes`, {
        method: "POST",
        headers: { 
          ...getApiHeaders(),
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear bien");
      }
      await flushQueue();
      await fetchBienes(true);
      return true;
    } catch (err: any) {
      const queue = readQueue();
      queue.push({ type: "add", payload: item });
      writeQueue(queue);
      setError("Sin conexión: el bien se guardó localmente y se sincronizará al volver internet.");
      return true;
    }
  };

  const update = async (id: string, patch: Partial<BienInput>) => {
    setError(null);
    const optimistic = items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    setItems(optimistic);
    writeCachedBienes(optimistic);

    try {
      const res = await fetch(`${API_BASE_URL}/api/bienes/${id}`, {
        method: "PUT",
        headers: { 
          ...getApiHeaders(),
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al actualizar bien");
      }
      await flushQueue();
      await fetchBienes(true);
      return true;
    } catch (err: any) {
      const queue = readQueue();
      queue.push({ type: "update", id, payload: patch });
      writeQueue(queue);
      setError("Sin conexión: cambios guardados localmente y pendientes de sincronización.");
      return true;
    }
  };

  const remove = async (id: string) => {
    setError(null);
    const optimistic = items.filter((it) => it.id !== id);
    setItems(optimistic);
    writeCachedBienes(optimistic);

    try {
      const res = await fetch(`${API_BASE_URL}/api/bienes/${id}`, {
        method: "DELETE",
        headers: getApiHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al eliminar bien");
      }
      await flushQueue();
      await fetchBienes(true);
      return true;
    } catch (err: any) {
      const queue = readQueue();
      queue.push({ type: "remove", id });
      writeQueue(queue);
      setError("Sin conexión: eliminación pendiente de sincronización.");
      return true;
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
