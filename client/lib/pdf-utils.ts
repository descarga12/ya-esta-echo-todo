import type { Bien } from "@/hooks/use-bienes";
import type { Product } from "@/hooks/use-almacen";
import { clipPdfText, isHeavyPdfRowCount } from "./pdf-helpers";

export { clipPdfText, isHeavyPdfRowCount } from "./pdf-helpers";

/** jsPDF: flujo comprimido + menos precisión numérica = archivo más pequeño */
const JSPDF_COMPRESS_OPTS = {
  orientation: "portrait" as const,
  unit: "mm" as const,
  format: "a4" as const,
  compress: true,
  precision: 2,
};

/** Carga jsPDF + plugin solo cuando se genera un PDF (reduce JS inicial / APK). */
export async function createCompressedJsPDF() {
  const { jsPDF } = await import("jspdf");
  const autoTableModule = await import("jspdf-autotable");
  
  // En algunos entornos ESM, el export puede estar en .default o ser el módulo mismo
  const autoTableFn = autoTableModule.default || (autoTableModule as any);
  
  const doc = new (jsPDF as any)(JSPDF_COMPRESS_OPTS as any);
  
  // Evitamos recursión infinita si autoTable ya existe o si autoTableFn es doc.autoTable
  if (typeof (doc as any).autoTable !== "function") {
    (doc as any).autoTable = function (options: any) {
      autoTableFn(this, options);
      return this;
    };
  }
  
  return doc;
}

/** Helper para obtener el finalY de la última tabla de forma segura */
function getLastAutoTableY(doc: any, fallbackY: number): number {
  return doc.lastAutoTable?.finalY || fallbackY;
}

export async function generateUserBienesPDF(userName: string, userBienes: Bien[]) {
  const heavy = isHeavyPdfRowCount(userBienes.length);
  const doc = await createCompressedJsPDF();

  doc.setFillColor(37, 99, 235);
  doc.rect(14, 10, 20, 20, "F");
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.setFont("helvetica", "bold");
  doc.text("DSFD", 38, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Sistema de Gestión de Activos e Inventario", 38, 26);

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);

  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text("REPORTE DE BIENES POR USUARIO", 105, 45, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`USUARIO ASIGNADO:`, 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(userName.toUpperCase(), 55, 55);

  doc.setFont("helvetica", "bold");
  doc.text(`FECHA DE EMISIÓN:`, 14, 61);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString(), 55, 61);

  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL ACTIVOS:`, 14, 67);
  doc.setFont("helvetica", "normal");
  doc.text(`${userBienes.length} unidades`, 55, 67);

  const tableColumn = ["CÓDIGO / SKU", "DENOMINACIÓN DEL BIEN", "CANT.", "OFICINA / UBICACIÓN", "REGISTRO"];
  const tableRows = userBienes.map((bien) => {
    let fecha = "N/A";
    try {
      if (bien.fecha_registro) {
        const d = new Date(bien.fecha_registro);
        if (!isNaN(d.getTime())) {
          fecha = d.toLocaleDateString();
        }
      }
    } catch {
      /* ignore */
    }

    return [
      clipPdfText(bien.sku || "N/A", 18),
      clipPdfText((bien.nombre || "Sin nombre").toUpperCase(), heavy ? 32 : 44),
      bien.cantidad || 0,
      clipPdfText((bien.ubicacion || "OFICINA CENTRAL").toUpperCase(), heavy ? 22 : 30),
      fecha,
    ];
  });

  doc.autoTable({
    startY: 75,
    head: [tableColumn],
    body: tableRows,
    theme: heavy ? "plain" : "grid",
    styles: { font: "helvetica", lineWidth: heavy ? 0 : 0.08 },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: heavy ? 7 : 8,
      fontStyle: "bold",
      halign: "center",
      cellPadding: heavy ? 1 : 1.5,
    },
    bodyStyles: {
      fontSize: heavy ? 6 : 7,
      textColor: [40, 40, 40],
      cellPadding: heavy ? 0.8 : 1.5,
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 40 },
      4: { cellWidth: 22, halign: "center" },
    },
    ...(heavy
      ? {}
      : {
          alternateRowStyles: { fillColor: [248, 250, 252] },
        }),
  });

  const finalY = getLastAutoTableY(doc, 75) + 30;
  if (finalY < 250) {
    doc.setDrawColor(150);
    doc.line(30, finalY, 80, finalY);
    doc.line(130, finalY, 180, finalY);
    doc.setFontSize(8);
    doc.text("FIRMA DEL USUARIO", 55, finalY + 5, { align: "center" });
    doc.text("CONTROL DE PATRIMONIO", 155, finalY + 5, { align: "center" });
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Documento generado por el Sistema de Inventario de la sbh - Página ${i} de ${pageCount}`,
      105,
      285,
      { align: "center" }
    );
  }

  doc.save(`Reporte_Activos_${userName.replace(/\s+/g, "_")}.pdf`);
}

export async function generateAlmacenPDF(products: Product[]) {
  const heavy = isHeavyPdfRowCount(products.length);
  const doc = await createCompressedJsPDF();

  doc.setFillColor(8, 145, 178);
  doc.rect(14, 10, 20, 20, "F");
  doc.setFontSize(22);
  doc.setTextColor(8, 145, 178);
  doc.setFont("helvetica", "bold");
  doc.text("ALMACÉN", 38, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Sistema de Gestión de Suministros y Consumibles", 38, 26);

  doc.setDrawColor(8, 145, 178);
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);

  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text("REPORTE GENERAL DE STOCK - ALMACÉN", 105, 45, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`FECHA DE EMISIÓN:`, 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString(), 55, 55);

  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL PRODUCTOS:`, 14, 61);
  doc.setFont("helvetica", "normal");
  doc.text(`${products.length} ítems registrados`, 55, 61);

  const tableColumn = ["CÓDIGO", "DESCRIPCIÓN DEL PRODUCTO", "UND.", "STOCK", "COSTO UNIT.", "VALOR TOTAL"];
  const dec = heavy ? 1 : 2;
  const tableRows = products.map((p) => {
    const stock = Number(p.stock) || 0;
    const costo = Number(p.costo_unit) || 0;
    return [
      clipPdfText(p.codigo || "N/A", 14),
      clipPdfText((p.nombre || "Sin nombre").toUpperCase(), heavy ? 28 : 38),
      clipPdfText((p.unidad || "UND").toUpperCase(), 6),
      stock,
      `$${costo.toFixed(dec)}`,
      `$${(stock * costo).toFixed(dec)}`,
    ];
  });

  doc.autoTable({
    startY: 70,
    head: [tableColumn],
    body: tableRows,
    theme: heavy ? "plain" : "grid",
    styles: { font: "helvetica", lineWidth: heavy ? 0 : 0.08 },
    headStyles: {
      fillColor: [8, 145, 178],
      textColor: [255, 255, 255],
      fontSize: heavy ? 7 : 8,
      fontStyle: "bold",
      halign: "center",
      cellPadding: heavy ? 1 : 1.5,
    },
    bodyStyles: {
      fontSize: heavy ? 6 : 7,
      textColor: [40, 40, 40],
      cellPadding: heavy ? 0.8 : 1.5,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
    },
  });

  const totalValor = products.reduce((acc, p) => acc + Number(p.stock) * Number(p.costo_unit), 0);
  const finalY = getLastAutoTableY(doc, 70) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`VALOR TOTAL DEL ALMACÉN: $${totalValor.toFixed(heavy ? 1 : 2)}`, 196, finalY, { align: "right" });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Reporte de Almacén de la sbh - Página ${i} de ${pageCount}`, 105, 285, { align: "center" });              
  }

  doc.save(`Reporte_Almacen_${new Date().toISOString().split("T")[0]}.pdf`);
}
