import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Bien } from "@/hooks/use-bienes";
import { Product } from "@/hooks/use-almacen";

export const generateUserBienesPDF = (userName: string, userBienes: Bien[]) => {
  const doc = new jsPDF() as any;

  // Cabecera Institucional (Simulación de Logo)
  doc.setFillColor(37, 99, 235); // Azul institucional
  doc.rect(14, 10, 20, 20, 'F');
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.setFont("helvetica", "bold");
  doc.text("DSFD", 38, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Sistema de Gestión de Activos e Inventario", 38, 26);

  // Línea decorativa
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);

  // Título del reporte
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text("REPORTE DE BIENES POR USUARIO", 105, 45, { align: "center" });

  // Información del Usuario y Reporte
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

  // Tabla de Bienes
  const tableColumn = ["CÓDIGO / SKU", "DENOMINACIÓN DEL BIEN", "CANT.", "OFICINA / UBICACIÓN", "REGISTRO"];
  const tableRows = userBienes.map(bien => [
    bien.sku || "N/A",
    (bien.nombre || "Sin nombre").toUpperCase(),
    bien.cantidad || 0,
    (bien.ubicacion || "OFICINA CENTRAL").toUpperCase(),
    bien.fecha_registro ? new Date(bien.fecha_registro).toLocaleDateString() : "N/A"
  ]);

  doc.autoTable({
    startY: 75,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [37, 99, 235], 
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 8,
      textColor: [50, 50, 50]
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 45 },
      4: { cellWidth: 25, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [245, 247, 251]
    }
  });

  // Espacio para Firmas
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  if (finalY < 250) {
    doc.setDrawColor(150);
    doc.line(30, finalY, 80, finalY);
    doc.line(130, finalY, 180, finalY);
    doc.setFontSize(8);
    doc.text("FIRMA DEL USUARIO", 55, finalY + 5, { align: "center" });
    doc.text("CONTROL DE PATRIMONIO", 155, finalY + 5, { align: "center" });
  }

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Documento generado por el Sistema de Inventario DSFD - Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
  }

  // Guardar el PDF
  doc.save(`Reporte_Activos_${userName.replace(/\s+/g, '_')}.pdf`);
};

export const generateAlmacenPDF = (products: Product[]) => {
  const doc = new jsPDF() as any;

  // Cabecera Institucional
  doc.setFillColor(8, 145, 178); // Cian oscuro (Cian-600)
  doc.rect(14, 10, 20, 20, 'F');
  doc.setFontSize(22);
  doc.setTextColor(8, 145, 178);
  doc.setFont("helvetica", "bold");
  doc.text("ALMACÉN", 38, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Sistema de Gestión de Suministros y Consumibles", 38, 26);

  // Línea decorativa
  doc.setDrawColor(8, 145, 178);
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);

  // Título del reporte
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.text("REPORTE GENERAL DE STOCK - ALMACÉN", 105, 45, { align: "center" });

  // Información del Reporte
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`FECHA DE EMISIÓN:`, 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString(), 55, 55);

  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL PRODUCTOS:`, 14, 61);
  doc.setFont("helvetica", "normal");
  doc.text(`${products.length} ítems registrados`, 55, 61);

  // Tabla de Productos
  const tableColumn = ["CÓDIGO", "DESCRIPCIÓN DEL PRODUCTO", "UND.", "STOCK", "COSTO UNIT.", "VALOR TOTAL"];
  const tableRows = products.map(p => [
    p.codigo || "N/A",
    (p.nombre || "Sin nombre").toUpperCase(),
    (p.unidad || "UND").toUpperCase(),
    p.stock || 0,
    `$${Number(p.costo_unit).toFixed(2)}`,
    `$${(Number(p.stock) * Number(p.costo_unit)).toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 70,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [8, 145, 178], 
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 8,
      textColor: [50, 50, 50]
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' }
    }
  });

  // Resumen de valorización
  const totalValor = products.reduce((acc, p) => acc + (Number(p.stock) * Number(p.costo_unit)), 0);
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`VALOR TOTAL DEL ALMACÉN: $${totalValor.toFixed(2)}`, 196, finalY, { align: "right" });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Reporte de Almacén DSFD - Página ${i} de ${pageCount}`, 105, 285, { align: "center" });
  }

  doc.save(`Reporte_Almacen_${new Date().toISOString().split('T')[0]}.pdf`);
};
