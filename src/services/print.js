// src/services/print.js

/**
 * Imprimir ticket de venta
 * @param {Object} venta - Datos de la venta
 * @param {Array} detalles - Detalles de los productos
 * @param {Object} config - Configuración de la tienda
 */
export const printTicket = (venta, detalles = [], config = {}) => {
  try {
    // Configuración por defecto
    const defaultConfig = {
      nombreTienda: '🍎 Frutería Control',
      direccion: 'Av. Principal #123, Querétaro',
      telefono: '442-123-4567',
      rfc: 'XAXX010101000',
      mensaje: '¡Gracias por su compra!',
      ...config
    };

    // Crear ventana de impresión
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión');
    }

    // Generar contenido HTML del ticket
    const ticketHTML = generateTicketHTML(venta, detalles, defaultConfig);
    
    // Escribir contenido en la ventana
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    
    // Esperar a que cargue e imprimir
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        // Cerrar ventana después de imprimir o cancelar
        setTimeout(() => printWindow.close(), 100);
      }, 250);
    };
    
    return { success: true, message: 'Ticket enviado a impresión' };
  } catch (error) {
    console.error('Error printing ticket:', error);
    return { success: false, message: 'Error al imprimir ticket', error };
  }
};

/**
 * Generar HTML del ticket
 */
const generateTicketHTML = (venta, detalles, config) => {
  const fecha = new Date(venta.fecha_venta || new Date());
  const fechaStr = fecha.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const horaStr = fecha.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Calcular subtotal y total
  const subtotal = venta.total || 0;
  const total = subtotal;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Ticket de Venta</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.3;
          padding: 10px;
          width: 300px;
          margin: 0 auto;
        }
        
        .ticket {
          width: 100%;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px dashed #000;
        }
        
        .store-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .store-info {
          font-size: 10px;
          line-height: 1.4;
        }
        
        .section {
          margin: 10px 0;
          padding: 5px 0;
          border-bottom: 1px dashed #000;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
          font-size: 11px;
        }
        
        .items-header {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin-bottom: 5px;
          padding-bottom: 3px;
          border-bottom: 1px solid #000;
        }
        
        .item {
          margin: 5px 0;
        }
        
        .item-name {
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        
        .totals {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #000;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
        
        .total-row.final {
          font-size: 14px;
          font-weight: bold;
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px dashed #000;
        }
        
        .footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 2px dashed #000;
          font-size: 11px;
        }
        
        .barcode {
          text-align: center;
          margin: 10px 0;
          font-family: 'Libre Barcode 128', cursive;
          font-size: 40px;
          letter-spacing: 0;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 5px;
          }
          
          .ticket {
            page-break-after: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <!-- Encabezado -->
        <div class="header">
          <div class="store-name">${config.nombreTienda}</div>
          <div class="store-info">
            ${config.direccion}<br>
            Tel: ${config.telefono}<br>
            RFC: ${config.rfc}
          </div>
        </div>
        
        <!-- Información de la venta -->
        <div class="section">
          <div class="info-row">
            <span>Ticket: #${venta.id || '0000'}</span>
            <span>${fechaStr}</span>
          </div>
          <div class="info-row">
            <span>Hora: ${horaStr}</span>
          </div>
          ${venta.cliente_nombre ? `
          <div class="info-row">
            <span>Cliente: ${venta.cliente_nombre}</span>
          </div>
          ` : ''}
          ${venta.cliente_telefono ? `
          <div class="info-row">
            <span>Tel: ${venta.cliente_telefono}</span>
          </div>
          ` : ''}
        </div>
        
        <!-- Productos -->
        <div class="section">
          <div class="items-header">
            <span>PRODUCTO</span>
            <span>IMPORTE</span>
          </div>
          
          ${detalles.map(item => `
            <div class="item">
              <div class="item-name">${item.nombre || item.producto_nombre || 'Producto'}</div>
              <div class="item-details">
                <span>${item.cantidad} x $${(item.precio_unitario || item.precio || 0).toFixed(2)}</span>
                <span>$${(item.subtotal || (item.cantidad * (item.precio_unitario || item.precio || 0))).toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Totales -->
        <div class="totals">
          <div class="total-row">
            <span>SUBTOTAL:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          ${venta.metodo_pago ? `
          <div class="total-row">
            <span>Método de pago:</span>
            <span>${venta.metodo_pago.toUpperCase()}</span>
          </div>
          ` : ''}
        </div>
        
        <!-- Código de barras simulado -->
        <div class="barcode">
          *${String(venta.id || '0000').padStart(8, '0')}*
        </div>
        
        <!-- Footer -->
        <div class="footer">
          ${config.mensaje}<br>
          <strong>Conserve su ticket</strong><br>
          www.fruteria.com
        </div>
      </div>
      
      <script>
        // Auto-imprimir al cargar
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 250);
        };
      </script>
    </body>
    </html>
  `;
};

/**
 * Vista previa del ticket antes de imprimir
 * @param {Object} venta - Datos de la venta
 * @param {Array} detalles - Detalles de los productos
 * @param {Object} config - Configuración de la tienda
 */
export const previewTicket = (venta, detalles = [], config = {}) => {
  try {
    const defaultConfig = {
      nombreTienda: '🍎 Frutería Control',
      direccion: 'Av. Principal #123, Querétaro',
      telefono: '442-123-4567',
      rfc: 'XAXX010101000',
      mensaje: '¡Gracias por su compra!',
      ...config
    };

    const previewWindow = window.open('', '_blank', 'width=400,height=700');
    
    if (!previewWindow) {
      throw new Error('No se pudo abrir la ventana de vista previa');
    }

    const ticketHTML = generateTicketHTML(venta, detalles, defaultConfig);
    
    // Agregar botón de impresión
    const previewHTML = ticketHTML.replace(
      '<script>',
      `
      <div style="text-align: center; margin: 20px 0; padding: 10px; background: #f0f0f0; position: sticky; top: 0;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 0 5px;">
          🖨️ Imprimir
        </button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #e53e3e; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin: 0 5px;">
          ✕ Cerrar
        </button>
      </div>
      <script>
        window.onload = function() {
          // No auto-imprimir en vista previa
        };
      `
    );
    
    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
    
    return { success: true, message: 'Vista previa generada' };
  } catch (error) {
    console.error('Error generating preview:', error);
    return { success: false, message: 'Error al generar vista previa', error };
  }
};

/**
 * Imprimir reporte de cierre de caja
 * @param {Object} data - Datos del cierre
 * @param {Object} config - Configuración
 */
export const printCierreCaja = (data, config = {}) => {
  try {
    const defaultConfig = {
      nombreTienda: '🍎 Frutería Control',
      direccion: 'Av. Principal #123, Querétaro',
      telefono: '442-123-4567',
      ...config
    };

    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión');
    }

    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString('es-MX');
    const horaStr = fecha.toLocaleTimeString('es-MX');

    const cierreHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Cierre de Caja</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            padding: 10px;
            width: 300px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px dashed #000;
          }
          .store-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .section {
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px dashed #000;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .row.total {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 2px solid #000;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px dashed #000;
          }
          @media print {
            body { margin: 0; padding: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${defaultConfig.nombreTienda}</div>
          <div style="font-size: 14px; font-weight: bold; margin-top: 5px;">
            CIERRE DE CAJA
          </div>
        </div>
        
        <div class="section">
          <div class="row"><span>Fecha:</span><span>${fechaStr}</span></div>
          <div class="row"><span>Hora:</span><span>${horaStr}</span></div>
          ${data.cajero ? `<div class="row"><span>Cajero:</span><span>${data.cajero}</span></div>` : ''}
        </div>
        
        <div class="section">
          <div style="font-weight: bold; margin-bottom: 5px;">VENTAS DEL DÍA</div>
          <div class="row"><span>Número de ventas:</span><span>${data.numeroVentas || 0}</span></div>
          <div class="row"><span>Total ventas:</span><span>$${(data.totalVentas || 0).toFixed(2)}</span></div>
        </div>
        
        <div class="section">
          <div style="font-weight: bold; margin-bottom: 5px;">MÉTODOS DE PAGO</div>
          <div class="row"><span>Efectivo:</span><span>$${(data.efectivo || 0).toFixed(2)}</span></div>
          <div class="row"><span>Tarjeta:</span><span>$${(data.tarjeta || 0).toFixed(2)}</span></div>
          <div class="row"><span>Transferencia:</span><span>$${(data.transferencia || 0).toFixed(2)}</span></div>
        </div>
        
        <div class="section">
          <div class="row total">
            <span>TOTAL EN CAJA:</span>
            <span>$${(data.totalCaja || 0).toFixed(2)}</span>
          </div>
          ${data.diferencia !== undefined ? `
            <div class="row" style="color: ${data.diferencia >= 0 ? 'green' : 'red'}; margin-top: 5px;">
              <span>Diferencia:</span>
              <span>$${data.diferencia.toFixed(2)}</span>
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <div style="margin: 20px 0;">
            _______________________<br>
            Firma del responsable
          </div>
          <div style="font-size: 10px;">
            Sistema Frutería Control<br>
            ${fechaStr} ${horaStr}
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 250);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(cierreHTML);
    printWindow.document.close();
    
    return { success: true, message: 'Cierre de caja enviado a impresión' };
  } catch (error) {
    console.error('Error printing cierre:', error);
    return { success: false, message: 'Error al imprimir cierre', error };
  }
};

/**
 * Imprimir etiqueta de producto
 * @param {Object} producto - Datos del producto
 * @param {Number} cantidad - Cantidad de etiquetas
 */
export const printEtiqueta = (producto, cantidad = 1) => {
  try {
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    
    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión');
    }

    const etiquetasHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Etiquetas de Producto</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 10px;
          }
          .etiqueta {
            width: 250px;
            height: 150px;
            border: 2px solid #000;
            padding: 10px;
            margin: 10px;
            display: inline-block;
            page-break-inside: avoid;
          }
          .nombre {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #000;
            padding-bottom: 5px;
          }
          .precio {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            color: #e53e3e;
            margin: 15px 0;
          }
          .info {
            font-size: 12px;
            text-align: center;
          }
          .barcode {
            text-align: center;
            margin: 10px 0;
            font-family: 'Libre Barcode 128', cursive;
            font-size: 30px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .etiqueta { margin: 5mm; }
          }
        </style>
      </head>
      <body>
        ${Array(cantidad).fill().map(() => `
          <div class="etiqueta">
            <div class="nombre">${producto.nombre}</div>
            <div class="precio">$${(producto.precio_venta || 0).toFixed(2)}</div>
            <div class="info">
              ${producto.categoria ? `${producto.categoria} • ` : ''}
              Por ${producto.unidad_medida || 'unidad'}
            </div>
            ${producto.sku ? `
              <div class="barcode">*${producto.sku}*</div>
            ` : ''}
          </div>
        `).join('')}
        
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 250);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(etiquetasHTML);
    printWindow.document.close();
    
    return { success: true, message: 'Etiquetas enviadas a impresión' };
  } catch (error) {
    console.error('Error printing etiquetas:', error);
    return { success: false, message: 'Error al imprimir etiquetas', error };
  }
};

const printService = {
  printTicket,
  previewTicket,
  printCierreCaja,
  printEtiqueta
};

export default printService;