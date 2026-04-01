import { useEffect, useMemo, useState } from "react";
import QRScanner from "@/components/qr/QRScanner";
import { QRCodeGenerator } from "@/components/qr/QRCodeGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { generateSku } from "@/lib/utils";
import { currentUser } from "@/lib/auth";
import { useBienes, Bien } from "@/hooks/use-bienes";
import { useImageUpload } from "@/hooks/use-image-upload";

function parseQR(text: string): Partial<Bien> {
  try {
    const data = JSON.parse(text);
    return {
      nombre: data.name || data.titulo || "",
      sku: data.sku || data.codigo || data.id || text,
      ubicacion: data.location || data.ubicacion || "",
      qr_code: text,
    };
  } catch {
    return { sku: text, qr_code: text };
  }
}

export default function Index() {
  const { items, add, update, remove, loading, error } = useBienes();
  const { uploadImage, isLoading: isUploading, error: uploadError } = useImageUpload();
  const [query, setQuery] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedItemForQR, setSelectedItemForQR] = useState<Bien | null>(null);
  const [draft, setDraft] = useState<Partial<Bien> & { photoPreview?: string }>({ cantidad: 1 });

  // Color de badge para info del registrador (teal o azul)
  const [badgeColor, setBadgeColor] = useState<"teal" | "blue">(
    () =>
      (localStorage.getItem("registradorBadgeColor") as "teal" | "blue") ||
      "teal",
  );
  useEffect(() => {
    try {
      localStorage.setItem("registradorBadgeColor", badgeColor);
    } catch {}
  }, [badgeColor]);

  // Filtros
  const [filterUnidad, setFilterUnidad] = useState<string>("all");
  const [filterCargo, setFilterCargo] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [infoOpen, setInfoOpen] = useState(false);

  // Auto-generar SKU al abrir diálogo de agregado manual y cuando cambia el nombre
  useEffect(() => {
    if (open) {
      setDraft((d) => ({ ...d, sku: generateSku(d.nombre || "") }));
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((it) => {
      // búsqueda de texto
      const matchesQuery =
        !q ||
        it.nombre?.toLowerCase().includes(q) ||
        it.sku?.toLowerCase().includes(q) ||
        (it.ubicacion || "").toLowerCase().includes(q);
      if (!matchesQuery) return false;

      // filtro de unidad
      if (
        filterUnidad !== "all" &&
        (it.registrado_unidad || "") !== filterUnidad
      )
        return false;
      // filtro de cargo
      if (filterCargo !== "all" && (it.registrado_cargo || "") !== filterCargo)
        return false;
      // filtro de usuario
      if (
        filterUser !== "all" &&
        (it.registrado_por || it.registrado_nombre || "") !== filterUser
      )
        return false;

      return true;
    });
  }, [items, query, filterUnidad, filterCargo, filterUser]);

  const onScan = (text: string) => {
    setScanError(null);
    const suggestion = parseQR(text);
    // si el SKU existe, incremento rápido; sino abrir modal
    const existing = items.find((it) => it.sku === suggestion.sku);
    if (existing) {
      update(existing.id, {
        cantidad: Math.max(0, (existing.cantidad || 0) + 1),
        qr_code: text,
      });
    } else {
      setDraft({ cantidad: 1, ...suggestion });
      setOpen(true);
    }
  };

  const submitDraft = async () => {
    const name = (draft.nombre || "").trim();
    let sku = (draft.sku || "").trim();
    const cantidad = Number(draft.cantidad || 0);
    if (!name) return;

    // Asegurar que el SKU exista y sea único entre items actuales (ignorar self al editar)
    const baseSku = sku || generateSku(name);
    const existingSet = new Set(items.map((it) => it.sku));
    if (draft.id) {
      const self = items.find((it) => it.id === draft.id);
      if (self && self.sku) existingSet.delete(self.sku);
    }

    let unique = baseSku;
    let counter = 1;
    while (existingSet.has(unique)) {
      unique = `${baseSku}-${String(counter).padStart(2, "0")}`;
      counter += 1;
    }
    sku = unique;

    // Si se está editando item existente
    if (draft.id) {
      const id = draft.id as string;
      const patch = {
        nombre: name,
        sku,
        cantidad: isNaN(cantidad) ? 0 : cantidad,
        ubicacion: draft.ubicacion || "",
        foto: draft.foto || undefined,
        qr_code: draft.qr_code || `${window.location.origin}/item/${id}`,
      };
      update(id, patch);
      setOpen(false);
      setDraft({ cantidad: 1 });
      return;
    }

    // info de registrador del usuario actual si está disponible
    const id = crypto.randomUUID();
    const qr_code = draft.qr_code || `${window.location.origin}/item/${id}`;
    const registrador = currentUser();

    const newItem = {
      id,
      nombre: name,
      sku,
      cantidad: isNaN(cantidad) ? 0 : cantidad,
      ubicacion: draft.ubicacion || "",
      qr_code,
      foto: draft.foto,
      registrado_por: registrador?.username,
      registrado_nombre: registrador?.name,
      registrado_unidad: registrador?.unidadOrganica,
      registrado_cargo: registrador?.cargo,
    };
    await add(newItem);
    setOpen(false);
    setDraft({ cantidad: 1 });
  };

  return (
    <section className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Inventario con QR
          </h1>
          <p className="text-muted-foreground">
            Escanea códigos QR para agregar o actualizar artículos al instante.
            También puedes buscar y editar manualmente.
          </p>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={(newOpen) => {
              setOpen(newOpen);
              if (!newOpen) {
                // Limpiar preview al cerrar
                setDraft((d) => {
                  const { photoPreview, ...rest } = d as any;
                  return rest;
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>Agregar manualmente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {draft?.id ? "Editar artículo" : "Nuevo artículo"}
                  </DialogTitle>
                  <DialogDescription>
                    Completa los datos del artículo
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">Código/SKU (automático)</Label>
                    <Input id="sku" value={draft.sku || ""} readOnly />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      value={draft.nombre || ""}
                      onChange={(e) =>
                        setDraft((d) => {
                          const nombre = e.target.value;
                          return { ...d, nombre, sku: generateSku(nombre) };
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="qty">Cantidad</Label>
                      <Input
                        id="qty"
                        type="number"
                        min={0}
                        value={draft.cantidad ?? 0}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            cantidad: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="loc">Ubicación</Label>
                      <Input
                        id="loc"
                        value={draft.ubicacion || ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, ubicacion: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Foto del objeto</Label>
                    <div className="flex items-center gap-2">
                      <label className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent/20 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                        Tomar foto (cámara)
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={isUploading}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            
                            // Mostrar preview mientras se sube
                            const reader = new FileReader();
                            reader.onload = () => {
                              setDraft((d) => ({
                                ...d,
                                photoPreview: reader.result as string,
                              }));
                            };
                            reader.readAsDataURL(f);
                            
                            // Subir al servidor
                            const result = await uploadImage(f);
                            if (result) {
                              setDraft((d) => ({
                                ...d,
                                foto: result.url,
                                photoPreview: result.url,
                              }));
                            }
                          }}
                        />
                      </label>

                      <label className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent/20 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                        Subir archivo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            
                            // Mostrar preview mientras se sube
                            const reader = new FileReader();
                            reader.onload = () => {
                              setDraft((d) => ({
                                ...d,
                                photoPreview: reader.result as string,
                              }));
                            };
                            reader.readAsDataURL(f);
                            
                            // Subir al servidor
                            const result = await uploadImage(f);
                            if (result) {
                              setDraft((d) => ({
                                ...d,
                                foto: result.url,
                                photoPreview: result.url,
                              }));
                            }
                          }}
                        />
                      </label>

                      <div className="ml-auto">
                        {draft.photoPreview ? (
                          <img
                            src={draft.photoPreview}
                            alt="preview"
                            className="h-16 w-16 rounded-md object-cover border"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-md border grid place-items-center text-xs text-muted-foreground">
                            No hay foto
                          </div>
                        )}
                      </div>
                    </div>
                    {uploadError && (
                      <p className="text-xs text-destructive">{uploadError}</p>
                    )}
                    {isUploading && (
                      <p className="text-xs text-muted-foreground">Subiendo...</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={submitDraft} disabled={isUploading || loading}>
                    {isUploading || loading ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="hidden md:block" />

        <div className="text-xs text-muted-foreground mt-1">
          Información: selecciona filtros para refinar resultados; pulsa "Info"
          para más detalles.
        </div>

        <div className="">
          <QRScanner
            onResult={onScan}
            onError={(e) => setScanError(e.message)}
          />
          {scanError && (
            <p className="mt-2 text-xs text-destructive">{scanError}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between gap-4 md:flex-row md:items-end">
          <div className="w-full">
            <CardTitle className="text-xl">Inventario ({items.length} bienes)</CardTitle>
            {loading && <span className="text-xs text-muted-foreground">Cargando...</span>}
            {error && <span className="text-xs text-destructive">{error}</span>}
          </div>
          <div className="w-full md:w-80">
            <div className="relative">
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-2 z-20">
                <button
                  type="button"
                  aria-pressed={badgeColor === "teal"}
                  onClick={() => setBadgeColor("teal")}
                  className={`h-6 w-6 rounded-full flex items-center justify-center ${badgeColor === "teal" ? "ring-2 ring-offset-1 ring-teal-500" : ""} bg-teal-400`}
                  title="Teal"
                />
                <button
                  type="button"
                  aria-pressed={badgeColor === "blue"}
                  onClick={() => setBadgeColor("blue")}
                  className={`h-6 w-6 rounded-full flex items-center justify-center ${badgeColor === "blue" ? "ring-2 ring-offset-1 ring-blue-500" : ""} bg-blue-400`}
                  title="Blue"
                />
              </div>

              <div className="p-2 bg-white/95 backdrop-blur-sm border border-gray-100 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 overflow-auto">
                  <div className="w-64 min-w-[220px]">
                    <Input
                      className="rounded-full md:text-sm"
                      placeholder="Buscar por nombre, código o ubicación..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  <select
                    value={filterUnidad}
                    onChange={(e) => setFilterUnidad(e.target.value)}
                    className="border rounded-full px-3 py-1.5 bg-white text-sm"
                  >
                    <option value="all">Todas las Unidades</option>
                    {Array.from(
                      new Set(items.map((it) => it.registrado_unidad).filter(Boolean)),
                    ).map((u) => (
                      <option key={u} value={u as string}>
                        {u}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterCargo}
                    onChange={(e) => setFilterCargo(e.target.value)}
                    className="border rounded-full px-3 py-1.5 bg-white text-sm"
                  >
                    <option value="all">Todos los Cargos</option>
                    {Array.from(
                      new Set(items.map((it) => it.registrado_cargo).filter(Boolean)),
                    ).map((c) => (
                      <option key={c} value={c as string}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="border rounded-full px-3 py-1.5 bg-white text-sm"
                  >
                    <option value="all">Todos los Usuarios</option>
                    {Array.from(
                      new Set(
                        items
                          .map((it) => it.registrado_por || it.registrado_nombre)
                          .filter(Boolean),
                      ),
                    ).map((u) => (
                      <option key={u} value={u as string}>
                        {u}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Info
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ayuda - Filtros</DialogTitle>
                        </DialogHeader>
                        <div className="text-sm text-muted-foreground">
                          Usa los filtros para reducir la lista por Unidad orgánica,
                          Cargo o Usuario. El buscador permite buscar por nombre, SKU o
                          ubicación.
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setInfoOpen(false)}>Cerrar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterUnidad("all");
                        setFilterCargo("all");
                        setFilterUser("all");
                        setQuery("");
                      }}
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground py-6">
              Cargando bienes desde la base de datos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6">
              No hay artículos. Escanea un QR o agrega uno manualmente.
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((it) => (
                <li
                  key={it.id}
                  className="py-3 grid grid-cols-1 md:grid-cols-[1fr_240px_auto] md:items-center gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      <a
                        href={`/item/${it.id}`}
                        className="font-semibold hover:underline"
                      >
                        {it.nombre}
                      </a>
                      <span className="text-muted-foreground font-normal">
                        • {it.sku}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {it.ubicacion
                        ? `Ubicación: ${it.ubicacion}`
                        : "Sin ubicación"}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center justify-center gap-2 px-2 py-0.5 rounded-md text-xs font-semibold ${badgeColor === "teal" ? "bg-teal-100 text-teal-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{it.registrado_unidad || "-"}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <div
                          className={`inline-block px-2 py-0.5 rounded-md text-xs ${badgeColor === "teal" ? "bg-teal-50 text-teal-700" : "bg-blue-50 text-blue-700"}`}
                        >
                          {it.registrado_nombre || it.registrado_por || "-"}
                        </div>
                        {it.registrado_cargo ? (
                          <div
                            className={`inline-block px-2 py-0.5 rounded-md text-xs ${badgeColor === "teal" ? "bg-teal-50 text-teal-700" : "bg-blue-50 text-blue-700"}`}
                          >
                            {it.registrado_cargo}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDraft(it);
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        update(it.id, {
                          cantidad: Math.max(0, (it.cantidad || 0) - 1),
                        })
                      }
                    >
                      -1
                    </Button>
                    <span className="w-14 text-center text-sm font-semibold tabular-nums">
                      {it.cantidad || 0}
                    </span>
                    <Button
                      size="sm"
                      onClick={() =>
                        update(it.id, { cantidad: (it.cantidad || 0) + 1 })
                      }
                    >
                      +1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItemForQR(it)}
                    >
                      Ver QR
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(it.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* QR Modal */}
      <Dialog open={!!selectedItemForQR} onOpenChange={(isOpen) => {
        if (!isOpen) setSelectedItemForQR(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR - {selectedItemForQR?.nombre}</DialogTitle>
            <DialogDescription>
              SKU: {selectedItemForQR?.sku}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedItemForQR && (
              <QRCodeGenerator 
                value={`${window.location.origin}/item/${selectedItemForQR.id}`}
                size="lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
