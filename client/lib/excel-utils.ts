import { Bien } from "@/hooks/use-bienes";

/**
 * Genera y descarga un archivo CSV compatible con Excel.
 * Esta es la forma más ligera ya que no requiere librerías externas.
 */
export function downloadBienesCSV(userName: string, bienes: Bien[]) {
  // 1. Definir encabezados
  const headers = ["Codigo/SKU", "Nombre", "Cantidad", "Ubicacion", "Registrado Por", "Fecha"];
  
  // 2. Transformar datos a filas
  const rows = bienes.map(b => [
    `"${b.sku || b.id}"`,
    `"${(b.nombre || "Sin nombre").replace(/"/g, '""')}"`, // Escapar comillas
    b.cantidad || 0,
    `"${(b.ubicacion || "N/A").replace(/"/g, '""')}"`,
    `"${(b.registrado_nombre || "N/A").replace(/"/g, '""')}"`,
    b.fecha_registro ? new Date(b.fecha_registro).toLocaleDateString() : "N/A"
  ]);

  // 3. Unir todo con punto y coma (mejor para Excel en español) o coma
  // Usamos el BOM (\uFEFF) para que Excel reconozca el encoding UTF-8 correctamente
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");

  // 4. Crear el blob y descargar
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const fileName = `Reporte_${userName.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.csv`;
  
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
