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
import { useAuth } from "@/lib/auth-context";
import { useBienes, Bien } from "@/hooks/use-bienes";
import { useImageUpload } from "@/hooks/use-image-upload";
import { generateUserBienesPDF } from "@/lib/pdf-utils";
import { API_BASE_URL, getApiHeaders } from "../lib/api-config";
import { 
  Search, 
  Plus, 
  QrCode, 
  Package, 
  MapPin, 
  User as UserIcon, 
  Edit3,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  Camera,
  Upload,
  AlertCircle,
  Filter,
  Building2,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Parsea el texto escaneado de un código QR.
 */
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
  const { user: currentUserSession, canEdit } = useAuth();
  const { uploadImage, isLoading: isUploading } = useImageUpload();
  
  const [query, setQuery] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedItemForQR, setSelectedItemForQR] = useState<Bien | null>(null);
  const [draft, setDraft] = useState<Partial<Bien> & { photoPreview?: string }>({ cantidad: 1 });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [locations, setLocations] = useState<{ id: number; nombre_departamento: string }[]>([]);
  const [badgeColor, setBadgeColor] = useState<"teal" | "blue">("blue");

  // Filtros
  const [filterUnidad, setFilterUnidad] = useState<string>("all");
  const [filterCargo, setFilterCargo] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [reportUser, setReportUser] = useState<string>("all");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/bienes/ubicaciones`, {
      headers: getApiHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLocations(data);
        } else {
          console.error("Ubicaciones no es un array:", data);
          setLocations([]);
        }
      })
      .catch(err => {
        console.error("Error cargando ubicaciones:", err);
        setLocations([]);
      });
  }, []);

  // Listas para filtros extraídas de los items
  const unidadesList = useMemo(() => Array.from(new Set(items.map(it => it.registrado_unidad).filter(Boolean))), [items]);
  const cargosList = useMemo(() => Array.from(new Set(items.map(it => it.registrado_cargo).filter(Boolean))), [items]);
  const usuariosList = useMemo(() => Array.from(new Set(items.map(it => it.registrado_nombre).filter(Boolean))), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchesQuery =
        !q ||
        (it.nombre || "").toLowerCase().includes(q) ||
        (it.sku || "").toLowerCase().includes(q) ||
        (it.ubicacion || "").toLowerCase().includes(q);
      
      if (!matchesQuery) return false;
      
      if (filterUnidad !== "all" && (it.registrado_unidad || "") !== filterUnidad) return false;
      if (filterCargo !== "all" && (it.registrado_cargo || "") !== filterCargo) return false;
      if (filterUser !== "all" && (it.registrado_nombre || "") !== filterUser) return false;
      
      return true;
    });
  }, [items, query, filterUnidad, filterCargo, filterUser]);

  const onScan = (text: string) => {
    setScanError(null);
    const suggestion = parseQR(text);
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
    if (!name) return;

    const payload: any = {
      ...draft,
      nombre: name,
      registrado_por: draft.registrado_por || currentUserSession?.id?.toString(),
      registrado_nombre: draft.registrado_nombre || currentUserSession?.nombre,
      registrado_unidad: draft.registrado_unidad || currentUserSession?.unidad_organica,
      registrado_cargo: draft.registrado_cargo || currentUserSession?.cargo,
    };

    delete payload.photoPreview;

    if (draft.id) {
      await update(draft.id, payload);
    } else {
      await add(payload);
    }
    setOpen(false);
    setDraft({ cantidad: 1 });
  };

  const generateUserReport = () => {
    if (reportUser === "all") return;
    const userItems = items.filter(it => it.registrado_nombre === reportUser);
    generateUserBienesPDF(reportUser, userItems);
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Package className="text-blue-500" />
              Inventario de <span className="text-blue-500">Bienes</span>
            </h1>
            <p className="text-slate-400 font-medium">Gestiona y escanea tus activos en tiempo real</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/50 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col min-w-[120px]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Total Bienes</span>
              <span className="text-2xl font-black text-white text-center">{items.length}</span>
            </div>

            {/* Selector de Reporte por Usuario */}
            <div className="flex items-center gap-2 bg-slate-950/50 border border-slate-800 rounded-2xl p-2">
              <select 
                value={reportUser}
                onChange={(e) => setReportUser(e.target.value)}
                className="bg-transparent text-white text-sm border-none focus:ring-0 cursor-pointer max-w-[150px] outline-none"
              >
                <option value="all" className="bg-slate-900 text-white">Reporte por Usuario...</option>
                {usuariosList.map(u => (
                  <option key={u} value={u} className="bg-slate-900 text-white">{u}</option>
                ))}
              </select>
              <Button 
                onClick={generateUserReport}
                disabled={reportUser === "all"}
                size="sm"
                className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-xl flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
            </div>

            {canEdit && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => setDraft({ cantidad: 1 })}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 px-8 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                  >
                    <Plus className="mr-2 w-5 h-5" /> Nuevo Bien
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-3xl max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">
                      {draft.id ? "Editar Bien" : "Nuevo Bien"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500">
                      Completa la información del activo para el inventario
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Bien</Label>
                      <Input 
                        placeholder="Ej: Laptop Dell XPS 13"
                        value={draft.nombre || ""} 
                        onChange={(e) => setDraft({...draft, nombre: e.target.value})}
                        className="bg-slate-950 border-slate-800 rounded-xl h-12"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Código / SKU</Label>
                        <Input 
                          value={draft.sku || ""} 
                          onChange={(e) => setDraft({...draft, sku: e.target.value})}
                          className="bg-slate-950 border-slate-800 rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Stock Inicial</Label>
                        <Input 
                          type="number"
                          min="0"
                          value={draft.cantidad || 1} 
                          onChange={(e) => setDraft({...draft, cantidad: parseInt(e.target.value) || 0})}
                          className="bg-slate-950 border-slate-800 rounded-xl h-12 focus-visible:ring-blue-500/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Ubicación Institucional</Label>
                      <select 
                        value={draft.ubicacion || ""} 
                        onChange={(e) => setDraft({...draft, ubicacion: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl h-12 px-4 text-sm focus:ring-1 focus:ring-blue-500/50 outline-none text-white"
                      >
                        <option value="" className="bg-slate-900">Seleccionar Ubicación...</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.nombre_departamento} className="bg-slate-900">{loc.nombre_departamento}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-3">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fotografía del Activo</Label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            type="button"
                            className="bg-slate-950 border-slate-800 rounded-xl h-20 flex-col gap-2 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
                            onClick={() => document.getElementById('camera-input')?.click()}
                          >
                            <Camera className="w-5 h-5 text-slate-500 group-hover:text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Cámara</span>
                            <input id="camera-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setDraft(d => ({...d, photoPreview: URL.createObjectURL(f)}));
                                const res = await uploadImage(f);
                                if (res) setDraft(d => ({...d, foto: res.url}));
                              }
                            }} />
                          </Button>
                          <Button 
                            variant="outline" 
                            type="button"
                            className="bg-slate-950 border-slate-800 rounded-xl h-20 flex-col gap-2 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
                            onClick={() => document.getElementById('file-input')?.click()}
                          >
                            <Upload className="w-5 h-5 text-slate-500 group-hover:text-blue-500" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">Subir</span>
                            <input id="file-input" type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setDraft(d => ({...d, photoPreview: URL.createObjectURL(f)}));
                                const res = await uploadImage(f);
                                if (res) setDraft(d => ({...d, foto: res.url}));
                              }
                            }} />
                          </Button>
                        </div>
                        <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                          {(draft.photoPreview || draft.foto) ? (
                            <img src={draft.photoPreview || draft.foto} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-slate-800" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button 
                      onClick={submitDraft}
                      disabled={isUploading || loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 h-14 font-black rounded-2xl shadow-lg shadow-blue-600/20"
                    >
                      {draft.id ? "Actualizar Activo" : "Registrar Activo"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>


      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="relative w-full lg:flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
              <Search size={20} />
            </div>
            <Input 
              placeholder="Buscar por nombre, SKU o ubicación..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-slate-900/50 border-slate-800 pl-12 h-14 rounded-2xl text-white placeholder:text-slate-600 focus-visible:ring-blue-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "h-14 px-5 rounded-2xl border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white flex gap-2",
                showFilters && "border-blue-500/50 text-blue-500 bg-blue-500/5"
              )}
            >
              <Filter size={18} />
              <span className="font-bold text-xs uppercase tracking-widest">Filtros</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="h-14 w-14 rounded-2xl border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
            >
              {viewMode === "grid" ? <ListIcon /> : <LayoutGrid />}
            </Button>
            
            <div className="flex-1 lg:flex-none">
              <QRScanner onResult={onScan} onError={(e) => setScanError(e.message)} />
            </div>
          </div>
        </div>

        {error && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200 space-y-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="font-semibold">No se pudo cargar los bienes.</p>
          </div>
          <p className="text-sm text-red-100">{error}</p>
          <p className="text-xs text-red-200">Verifica la conexión al servidor o los filtros activos.</p>
        </div>
      )}
      {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-900/50 border border-slate-800 rounded-3xl animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unidad Orgánica</Label>
              <select 
                value={filterUnidad}
                onChange={(e) => setFilterUnidad(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white h-11 rounded-xl px-4 text-sm focus:ring-1 focus:ring-blue-500/50 outline-none"
              >
                <option value="all">Todas las unidades</option>
                {unidadesList.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cargo</Label>
              <select 
                value={filterCargo}
                onChange={(e) => setFilterCargo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white h-11 rounded-xl px-4 text-sm focus:ring-1 focus:ring-blue-500/50 outline-none"
              >
                <option value="all">Todos los cargos</option>
                {cargosList.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Registrador</Label>
              <select 
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white h-11 rounded-xl px-4 text-sm focus:ring-1 focus:ring-blue-500/50 outline-none"
              >
                <option value="all">Todos los usuarios</option>
                {usuariosList.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-3 pt-4 border-t border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Color de Etiquetas:</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setBadgeColor("teal")}
                    className={cn(
                      "w-6 h-6 rounded-full bg-teal-500 border-2 border-transparent transition-all",
                      badgeColor === "teal" && "border-white scale-110 shadow-lg shadow-teal-500/50"
                    )}
                  />
                  <button 
                    onClick={() => setBadgeColor("blue")}
                    className={cn(
                      "w-6 h-6 rounded-full bg-blue-500 border-2 border-transparent transition-all",
                      badgeColor === "blue" && "border-white scale-110 shadow-lg shadow-blue-500/50"
                    )}
                  />
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setFilterUnidad("all"); setFilterCargo("all"); setFilterUser("all"); }}
                className="text-xs font-bold text-slate-500 hover:text-white"
              >
                LIMPIAR FILTROS
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-64 bg-slate-900/50 border border-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-700" />
          <p className="text-slate-500 font-medium">No se encontraron bienes.</p>
          <p className="text-sm text-slate-400 text-center max-w-md">
            Revisa que no tengas filtros activos, borra la búsqueda o comprueba que el servidor esté conectado.
          </p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-6",
          viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {filtered.map((item) => (
            <Card key={item.id} className="group bg-slate-900/50 border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              {item.foto && (
                <div className="h-40 w-full overflow-hidden border-b border-slate-800">
                  <img 
                    src={item.foto} 
                    alt={item.nombre} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
              )}
              <CardHeader className="p-6 pb-2 relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                    <Package size={24} />
                  </div>
                  <div className="flex gap-1">
                    {canEdit && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setDraft(item); setOpen(true); }}
                          className="h-9 w-9 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800"
                        >
                          <Edit3 size={18} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            if (confirm(`¿Eliminar "${item.nombre}"?`)) remove(item.id);
                          }}
                          className="h-9 w-9 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 size={18} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                  {item.nombre}
                </CardTitle>
                <p className="text-xs font-mono text-slate-500 tracking-tighter mt-1">{item.sku}</p>
              </CardHeader>
              
              <CardContent className="p-6 pt-4 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock Disponible</p>
                    <p className="text-2xl font-black text-white">{item.cantidad}</p>
                  </div>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedItemForQR(item)}
                    className="h-12 w-12 rounded-xl border-slate-800 bg-slate-950 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-inner"
                  >
                    <QrCode size={20} />
                  </Button>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-3 text-slate-400">
                    <MapPin size={16} className="text-slate-600" />
                    <span className="text-sm font-medium truncate">{item.ubicacion || "Sin ubicación"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex flex-col gap-0.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-full",
                      badgeColor === "teal" ? "bg-teal-500/10 text-teal-500 border border-teal-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    )}>
                      <div className="flex items-center gap-2">
                        <UserIcon size={12} />
                        <span className="truncate">{item.registrado_nombre || "Usuario"}</span>
                      </div>
                      {item.registrado_unidad && (
                        <div className="flex items-center gap-2 opacity-70 mt-1">
                          <Building2 size={10} />
                          <span className="truncate font-medium">{item.registrado_unidad}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* QR Viewer Dialog */}
      <Dialog open={!!selectedItemForQR} onOpenChange={() => setSelectedItemForQR(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center font-black text-xl">Código QR del Activo</DialogTitle>
            <DialogDescription className="text-center text-slate-500">
              Usa este código para identificar el bien rápidamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 space-y-6">
            <div className="p-6 bg-white rounded-3xl shadow-2xl">
              {selectedItemForQR && (
                <QRCodeGenerator 
                  value={selectedItemForQR.qr_code || selectedItemForQR.sku} 
                  size="sm"
                />
              )}
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-white">{selectedItemForQR?.nombre}</p>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mt-1">{selectedItemForQR?.sku}</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => setSelectedItemForQR(null)}
            className="w-full h-14 rounded-2xl font-bold bg-slate-900 hover:bg-slate-800 border-slate-800"
          >
            Cerrar Vista
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
