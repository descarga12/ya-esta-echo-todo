import { useState, useEffect } from "react";
import { API_BASE_URL, getApiHeaders } from "@/lib/api-config";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Package, 
  MapPin,
  Calendar,
  AlertCircle,
  Download,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a'];

export default function Reportes() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = API_BASE_URL || window.location.origin;
    console.log("[Reportes] Cargando desde:", `${baseUrl}/api/bienes/stats`);
    
    fetch(`${baseUrl}/api/bienes/stats`, {
      headers: getApiHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}: No se pudo obtener las estadísticas`);
        return res.json();
      })
      .then(data => {
        console.log("[Reportes] Stats recibidas:", data);
        if (!data || !data.summary) throw new Error("Datos de estadísticas inválidos");
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("[Reportes] ERROR:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const downloadGeneralStockPDF = async () => {
    if (!stats) return;
    
    try {
      const baseUrl = API_BASE_URL || window.location.origin;
      const res = await fetch(`${baseUrl}/api/bienes`, {
        headers: getApiHeaders()
      });
      const bienes = await res.json();

      const doc = new jsPDF() as any;
      
      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(14, 10, 20, 20, 'F');
      doc.setFontSize(22);
      doc.setTextColor(37, 99, 235);
      doc.setFont("helvetica", "bold");
      doc.text("SBH", 38, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Reporte General de Stock e Inventario", 38, 26);
      
      doc.line(14, 35, 196, 35);
      
      doc.setTextColor(0);
      doc.setFontSize(16);
      doc.text("INVENTARIO GENERAL DE ACTIVOS", 105, 45, { align: "center" });
      
      // Stats Summary in PDF
      doc.setFontSize(10);
      doc.text(`Total de Bienes Únicos: ${stats.summary.total}`, 14, 55);
      doc.text(`Stock Total Acumulado: ${stats.summary.stockTotal}`, 14, 62);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 69);

      // Table of all items
      const tableColumn = ["CÓDIGO/SKU", "DENOMINACIÓN", "CANT.", "UBICACIÓN", "REGISTRO"];
      const tableRows = bienes.map((b: any) => [
        b.sku || "N/A",
        (b.nombre || "Sin nombre").toUpperCase(),
        b.cantidad || 0,
        (b.ubicacion || "N/A").toUpperCase(),
        b.fecha_registro ? new Date(b.fecha_registro).toLocaleDateString() : "N/A"
      ]);

      doc.autoTable({
        startY: 80,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], fontSize: 8 },
        bodyStyles: { fontSize: 7 }
      });

      doc.save(`Reporte_Inventario_General_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("No se pudo generar el reporte detallado.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500 animate-pulse">
          <BarChart3 className="w-12 h-12" />
          <span className="font-black uppercase tracking-widest text-blue-500">Cargando Reportes...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-black text-white uppercase">Error de Carga</h2>
          <p className="text-slate-400 text-sm">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl w-full font-bold"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <BarChart3 className="w-10 h-10 text-blue-500" />
              Reportes e Inteligencia
            </h1>
            <p className="text-slate-500 font-medium italic">Análisis en tiempo real del inventario institucional</p>
          </div>
          <Button 
            onClick={downloadGeneralStockPDF}
            className="bg-blue-600 hover:bg-blue-500 h-12 rounded-2xl px-6 font-bold shadow-lg shadow-blue-600/20"
          >
            <Download className="w-4 h-4 mr-2" /> Descargar Stock PDF
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Package className="w-16 h-16" />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Bienes Únicos</span>
            <div className="text-4xl font-black mt-2 text-blue-500">{stats?.summary?.total || 0}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-16 h-16" />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Stock Acumulado</span>
            <div className="text-4xl font-black mt-2 text-emerald-500">{stats?.summary?.stockTotal || 0}</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-16 h-16" />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Oficinas Activas</span>
            <div className="text-4xl font-black mt-2 text-indigo-500">{stats?.byOficina?.length || 0}</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Distribución por Oficina */}
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur space-y-6">
            <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-500" />
              Distribución por Oficina (Top 5)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.byOficina}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats?.byOficina?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tendencia de Registro */}
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur space-y-6">
            <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Tendencia de Registro Mensual
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    dot={{ fill: '#3b82f6', r: 6 }} 
                    activeDot={{ r: 8, strokeWidth: 0 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Placeholder / Próximamente */}
        <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-xl font-black uppercase tracking-wider text-blue-400">Próximamente: reportes de movimientos y tendencias</h4>
            <p className="text-slate-400 text-sm">Pide aquí los reportes que necesitas y los añadimos. Esta sección es un placeholder mientras expandimos el sistema.</p>
          </div>
          <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 rounded-xl">
            Sugerir un reporte <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
