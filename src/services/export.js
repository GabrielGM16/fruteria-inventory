// src/services/export.js
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Convierte un valor a número de forma segura
 */
const toSafeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Exportar datos a Excel
 */
export const exportToExcel = (data, filename = 'datos', sheetName = 'Hoja1') => {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Ajustar ancho de columnas
    const maxWidth = 50;
    const columnWidths = [];
    
    if (data.length > 0) {
      Object.keys(data[0]).forEach((key, index) => {
        const maxLength = Math.max(
          key.length,
          ...data.map(row => row[key] ? String(row[key]).length : 0)
        );
        columnWidths[index] = { wch: Math.min(maxLength + 2, maxWidth) };
      });
      worksheet['!cols'] = columnWidths;
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    
    return { success: true, message: 'Archivo Excel exportado exitosamente' };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, message: 'Error al exportar a Excel', error };
  }
};

/**
 * Exportar datos a CSV
 */
export const exportToCSV = (data, filename = 'datos') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }
    
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true, message: 'Archivo CSV exportado exitosamente' };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, message: 'Error al exportar a CSV', error };
  }
};

/**
 * Exportar datos a PDF (tabla simple)
 */
export const exportToPDF = (data, filename = 'reporte', title = 'Reporte', options = {}) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No hay datos para exportar');
    }
    
    const doc = new jsPDF(options.orientation || 'portrait');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Encabezado
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const fecha = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Fecha: ${fecha}`, 14, 30);
    
    // Preparar datos para la tabla
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      return String(value);
    }));
    
    // Agregar tabla usando autoTable
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: 35, left: 14, right: 14 },
    });
    
    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`${filename}.pdf`);
    
    return { success: true, message: 'Archivo PDF exportado exitosamente' };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, message: 'Error al exportar a PDF', error };
  }
};

/**
 * Exportar reporte de inventario a PDF
 */
export const exportInventarioToPDF = (productos, stats = {}) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Encabezado
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('📦 REPORTE DE INVENTARIO', pageWidth / 2, 20, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const fecha = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Generado: ${fecha}`, 14, 30);
    
    // Estadísticas
    let yPos = 40;
    if (stats.totalProductos !== undefined) {
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Resumen:', 14, yPos);
      yPos += 7;
      
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`• Total de productos: ${stats.totalProductos || 0}`, 20, yPos);
      yPos += 6;
      doc.text(`• Productos con stock bajo: ${stats.stockBajo || 0}`, 20, yPos);
      yPos += 6;
      doc.text(`• Valor total inventario: $${toSafeNumber(stats.valorTotal).toFixed(2)}`, 20, yPos);
      yPos += 10;
    }
    
    // Tabla de productos
    const headers = ['Producto', 'Categoría', 'Stock', 'Mínimo', 'Precio', 'Valor'];
    const rows = productos.map(p => {
      const stockActual = toSafeNumber(p.stock_actual);
      const stockMinimo = toSafeNumber(p.stock_minimo);
      const precioVenta = toSafeNumber(p.precio_venta);
      const valorTotal = stockActual * precioVenta;
      
      return [
        p.nombre,
        p.categoria || '-',
        `${stockActual.toFixed(2)} ${p.unidad_medida || ''}`,
        `${stockMinimo.toFixed(2)}`,
        `$${precioVenta.toFixed(2)}`,
        `$${valorTotal.toFixed(2)}`
      ];
    });
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPos,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
    });
    
    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`inventario_${new Date().getTime()}.pdf`);
    
    return { success: true, message: 'Reporte de inventario exportado' };
  } catch (error) {
    console.error('Error exporting inventario to PDF:', error);
    return { success: false, message: 'Error al exportar reporte', error };
  }
};

/**
 * Exportar reporte de ventas a PDF
 */
export const exportVentasToPDF = (ventas, stats = {}, periodo = {}) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Encabezado
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('💰 REPORTE DE VENTAS', pageWidth / 2, 20, { align: 'center' });
    
    // Período
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    if (periodo.inicio && periodo.fin) {
      doc.text(
        `Período: ${periodo.inicio} - ${periodo.fin}`,
        pageWidth / 2,
        28,
        { align: 'center' }
      );
    }
    
    // Estadísticas
    let yPos = 38;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Resumen:', 14, yPos);
    yPos += 7;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`• Total de ventas: ${stats.totalVentas || 0}`, 20, yPos);
    yPos += 6;
    doc.text(`• Ingresos totales: $${toSafeNumber(stats.ingresosTotal).toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`• Ticket promedio: $${toSafeNumber(stats.ticketPromedio).toFixed(2)}`, 20, yPos);
    yPos += 6;
    doc.text(`• Ganancia total: $${toSafeNumber(stats.gananciaTotal).toFixed(2)}`, 20, yPos);
    yPos += 10;
    
    // Tabla de ventas
    const headers = ['Fecha', 'Cliente', 'Método Pago', 'Total'];
    const rows = ventas.map(v => [
      new Date(v.fecha_venta).toLocaleDateString('es-MX'),
      v.cliente_nombre || 'Cliente General',
      v.metodo_pago || '-',
      `$${toSafeNumber(v.total).toFixed(2)}`
    ]);
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPos,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: {
        fillColor: [72, 187, 120],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' },
      },
    });
    
    // Total final
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(
      `TOTAL: $${toSafeNumber(stats.ingresosTotal).toFixed(2)}`,
      pageWidth - 14,
      finalY,
      { align: 'right' }
    );
    
    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`ventas_${new Date().getTime()}.pdf`);
    
    return { success: true, message: 'Reporte de ventas exportado' };
  } catch (error) {
    console.error('Error exporting ventas to PDF:', error);
    return { success: false, message: 'Error al exportar reporte', error };
  }
};

// Funciones de formateo para exportación
export const formatProductosForExport = (productos) => {
  return productos.map(p => {
    const stockActual = toSafeNumber(p.stock_actual);
    const stockMinimo = toSafeNumber(p.stock_minimo);
    const precioCompra = toSafeNumber(p.precio_compra);
    const precioVenta = toSafeNumber(p.precio_venta);
    const valorTotal = stockActual * precioVenta;
    
    return {
      'Nombre': p.nombre,
      'Categoría': p.categoria || '-',
      'Stock Actual': stockActual.toFixed(2),
      'Stock Mínimo': stockMinimo.toFixed(2),
      'Unidad': p.unidad_medida || '-',
      'Precio Compra': `$${precioCompra.toFixed(2)}`,
      'Precio Venta': `$${precioVenta.toFixed(2)}`,
      'Valor Total': `$${valorTotal.toFixed(2)}`,
      'Estado': p.activo ? 'Activo' : 'Inactivo'
    };
  });
};

export const formatVentasForExport = (ventas) => {
  return ventas.map(v => {
    const total = toSafeNumber(v.total);
    
    return {
      'Fecha': new Date(v.fecha_venta).toLocaleDateString('es-MX'),
      'Hora': new Date(v.fecha_venta).toLocaleTimeString('es-MX'),
      'Cliente': v.cliente_nombre || 'Cliente General',
      'Teléfono': v.cliente_telefono || '-',
      'Método de Pago': v.metodo_pago || '-',
      'Total': `$${total.toFixed(2)}`
    };
  });
};

export const formatEntradasForExport = (entradas, productos) => {
  return entradas.map(e => {
    const producto = productos.find(p => p.id === e.producto_id);
    const cantidad = toSafeNumber(e.cantidad);
    const precioCompra = toSafeNumber(e.precio_compra);
    const total = cantidad * precioCompra;
    
    return {
      'Fecha': new Date(e.fecha_entrada).toLocaleDateString('es-MX'),
      'Producto': producto?.nombre || '-',
      'Cantidad': cantidad.toFixed(2),
      'Precio Compra': `$${precioCompra.toFixed(2)}`,
      'Total': `$${total.toFixed(2)}`,
      'Proveedor': e.proveedor || '-',
      'Nota': e.nota || '-'
    };
  });
};

export const formatMermasForExport = (mermas, productos) => {
  return mermas.map(m => {
    const producto = productos.find(p => p.id === m.producto_id);
    const cantidad = toSafeNumber(m.cantidad);
    const precioVenta = toSafeNumber(producto?.precio_venta);
    const valor = cantidad * precioVenta;
    
    return {
      'Fecha': new Date(m.fecha_merma || m.created_at).toLocaleDateString('es-MX'),
      'Producto': producto?.nombre || '-',
      'Cantidad': cantidad.toFixed(2),
      'Motivo': m.motivo,
      'Valor Pérdida': `$${valor.toFixed(2)}`,
      'Descripción': m.descripcion || '-'
    };
  });
};

export const formatProveedoresForExport = (proveedores) => {
  return proveedores.map(p => ({
    'Nombre': p.nombre,
    'Contacto': p.contacto || '-',
    'Teléfono': p.telefono || '-',
    'Email': p.email || '-',
    'RFC': p.rfc || '-',
    'Dirección': p.direccion || '-',
    'Productos': p.productos_suministrados || '-',
    'Estado': p.activo ? 'Activo' : 'Inactivo'
  }));
};

const exportService = {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  exportInventarioToPDF,
  exportVentasToPDF,
  formatProductosForExport,
  formatVentasForExport,
  formatEntradasForExport,
  formatMermasForExport,
  formatProveedoresForExport
};

export default exportService;