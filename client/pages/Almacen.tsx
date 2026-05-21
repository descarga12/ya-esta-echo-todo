import { useEffect, useState, useMemo, useCallback } from "react";
import { API_BASE_URL, getApiHeaders } from "../lib/api-config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Tags, 
  FileText, 
  ShoppingCart, 
  Loader2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  LayoutGrid, 
  List as ListIcon 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useAlmacen, Product } from "@/hooks/use-almacen";
import { generateAlmacenPDF } from "@/lib/pdf-utils";

interface Category {
  idcategoria: number;
  nombre: string;
  descripcion: string;
}

interface Comprobante {
  id_compro: number;
  nom_docu: string;
}

export default function Almacen() {
  const { products, loading: productsLoading, add, update, remove, refresh } = useAlmacen();
  const [categories, setCategories] = useState<Category[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
    const { user: currentUser } = useAuth();     
  // Filtros y búsqueda
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Product>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const fetchExtras = async () => {
    setLoadingExtras(true);
    try {
      const [catRes, compRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/categorias`, { headers: getApiHeaders() }),
        fetch(`${API_BASE_URL}/api/comprobantes`, { headers: getApiHeaders() })
      ]);

      if (catRes.ok) setCategories(await catRes.json());
      if (compRes.ok) setComprobantes(await compRes.json());
    } catch (error) {
      console.error("Error fetching extra almacen data:", error);
    } finally {
      setLoadingExtras(false);
    }
  };

  useEffect(() => {
    fetchExtras();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => 
      (p.nombre || "").toLowerCase().includes(q) || 
      (p.codigo || "").toLowerCase().includes(q) ||
      (p.descripcion || "").toLowerCase().includes(q)
    );
  }, [products, query]);

  const submitDraft = async () => {
    if (!draft.nombre) return;

    const payload = {
      ...draft,
      id_user: currentUser?.id
    };

    let success = false;
    if (draft.id) {
      success = await update(draft.id, payload);
    } else {
      success = await add(payload);
    }

    if (success) {
      setOpen(false);
      setDraft({});
    }
  };

  const handleDeleteProduct = useCallback(async (id: number) => {
    if (confirm("¿Eliminar este producto?")) {
      await remove(id);
    }
  }, [remove]);

  const handleExportPDF = useCallback(() => {
    void generateAlmacenPDF(filteredProducts);
  }, [filteredProducts]);

  if (productsLoading && products.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-white space-y-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight">Gestión de <span className="text-blue-500">Almacén</span></h1>
              <p className="text-slate-400 mt-2 font-medium">Visualiza y gestiona productos, categorías y documentos</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-slate-950/50 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col min-w-[120px]">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Productos</span>
                <span className="text-2xl font-black text-white text-center">{products.length}</span>
              </div>

              <Button 
                onClick={handleExportPDF}
                variant="outline"
                className="bg-cyan-600/10 text-cyan-400 border-cyan-600/20 hover:bg-cyan-600/20 h-14 px-6 rounded-2xl gap-2 hidden md:flex"
              >
                <FileText className="w-5 h-5" />
                <span className="font-bold text-xs uppercase tracking-widest">Exportar PDF</span>
              </Button>
              
              {currentUser && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => setDraft({})}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 px-8 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    >
                      <Plus className="mr-2 w-5 h-5" /> Nuevo Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-3xl max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black">
                        {draft.id ? "Editar Producto" : "Nuevo Producto"}
                      </DialogTitle>
                      <DialogDescription className="text-slate-500">
                        Completa la información del producto para el almacén
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Producto</Label>
                        <Input 
                          placeholder="Ej: Papel Bond A4"
                          value={draft.nombre || ""} 
                          onChange={(e) => setDraft({...draft, nombre: e.target.value})}
                          className="bg-slate-950 border-slate-800 rounded-xl h-12 focus-visible:ring-blue-500/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Código</Label>
                          <Input 
                            value={draft.codigo || ""} 
                            onChange={(e) => setDraft({...draft, codigo: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Unidad</Label>
                          <Input 
                            placeholder="Ej: UNID, LT, KG"
                            value={draft.unidad || ""} 
                            onChange={(e) => setDraft({...draft, unidad: e.target.value})}
                            className="bg-slate-950 border-slate-800 rounded-xl h-12"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Stock</Label>
                          <Input 
                            type="number"
                            value={draft.stock || 0} 
                            onChange={(e) => setDraft({...draft, stock: parseFloat(e.target.value) || 0})}
                            className="bg-slate-950 border-slate-800 rounded-xl h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Costo Unit.</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={draft.costo_unit || 0} 
                            onChange={(e) => setDraft({...draft, costo_unit: parseFloat(e.target.value) || 0})}
                            className="bg-slate-950 border-slate-800 rounded-xl h-12"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción</Label>
                        <Input 
                          value={draft.descripcion || ""} 
                          onChange={(e) => setDraft({...draft, descripcion: e.target.value})}
                          className="bg-slate-950 border-slate-800 rounded-xl h-12"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={submitDraft}
                        className="w-full bg-blue-600 hover:bg-blue-500 h-14 font-black rounded-2xl shadow-lg shadow-blue-600/20"
                      >
                        {draft.id ? "Actualizar Producto" : "Registrar Producto"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="relative w-full lg:flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
              <Search size={20} />
            </div>
            <Input 
              placeholder="Buscar productos por nombre, código o descripción..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-slate-900/50 border-slate-800 pl-12 h-14 rounded-2xl text-white placeholder:text-slate-600 focus-visible:ring-blue-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="h-14 w-14 rounded-2xl border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white"
            >
              {viewMode === "grid" ? <ListIcon /> : <LayoutGrid />}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { refresh(); fetchExtras(); }}
              className="h-14 px-6 rounded-2xl border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white flex gap-2"
            >
              <Loader2 className={cn("w-4 h-4", productsLoading && "animate-spin")} />
              <span className="font-bold text-xs uppercase tracking-widest">Sincronizar</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="productos" className="w-full">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl mb-8 h-12">
            <TabsTrigger value="productos" className="rounded-lg px-8 h-full data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold transition-all">
              <Package className="w-4 h-4 mr-2" /> Productos
            </TabsTrigger>
            <TabsTrigger value="categorias" className="rounded-lg px-8 h-full data-[state=active]:bg-cyan-600 data-[state=active]:text-white font-bold transition-all">
              <Tags className="w-4 h-4 mr-2" /> Categorías
            </TabsTrigger>
            <TabsTrigger value="comprobantes" className="rounded-lg px-8 h-full data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold transition-all">
              <FileText className="w-4 h-4 mr-2" /> Comprobantes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="productos" className="space-y-6">
            <div className={cn(
              "grid gap-6",
              viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
            )}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => (
                  <Card key={prod.id} className="group bg-slate-900/50 border-slate-800 hover:border-blue-500/50 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                    <CardHeader className="p-6 pb-2">
                      <div className="flex justify-between items-start">
                        <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div className="flex gap-1">
                          {currentUser && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => { setDraft(prod); setOpen(true); }}
                                className="h-9 w-9 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800"
                              >
                                <Edit3 size={18} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="h-9 w-9 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 size={18} />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 space-y-1">
                        <CardTitle className="text-xl font-bold group-hover:text-blue-400 transition-colors line-clamp-1">{prod.nombre}</CardTitle>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{prod.codigo}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-4 space-y-6">
                      <p className="text-sm text-slate-400 line-clamp-2 h-10">{prod.descripcion || "Sin descripción disponible"}</p>
                      
                      <div className="flex justify-between items-center pt-6 border-t border-slate-800/50">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stock</p>
                          <p className="text-2xl font-black text-white">{prod.stock} <span className="text-xs font-medium text-slate-500">{prod.unidad}</span></p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Costo Unit.</p>
                          <p className="text-2xl font-black text-blue-400">${Number(prod.costo_unit).toFixed(2)}</p>
                        </div>
                      </div>

                      {prod.registrado_nombre && (
                        <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-500 font-medium italic">
                          <span>Registrado por: {prod.registrado_nombre}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border border-dashed border-slate-800 space-y-4">
                  <Package className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-slate-500 font-medium">No se encontraron productos</p>
                  {query && (
                    <Button variant="ghost" onClick={() => setQuery("")} className="text-blue-500 hover:text-blue-400">
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categorias">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loadingExtras ? (
                [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-900/50 border border-slate-800 rounded-3xl animate-pulse" />)
              ) : categories.map((cat) => (
                <Card key={cat.idcategoria} className="bg-slate-900/50 border-slate-800 p-6 rounded-3xl hover:border-cyan-500/50 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-cyan-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                      <Tags className="w-6 h-6 text-cyan-500" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-cyan-400 transition-colors">{cat.nombre}</h3>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-3">{cat.descripcion || "Sin descripción"}</p>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comprobantes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loadingExtras ? (
                [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-900/50 border border-slate-800 rounded-3xl animate-pulse" />)
              ) : comprobantes.map((comp) => (
                <Card key={comp.id_compro} className="bg-slate-900/50 border-slate-800 p-6 flex items-center gap-4 rounded-3xl hover:border-emerald-500/50 transition-all group">
                  <div className="bg-emerald-500/10 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold group-hover:text-emerald-400 transition-colors">{comp.nom_docu}</h3>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
