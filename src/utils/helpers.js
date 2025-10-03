// src/utils/helpers.js

/**
 * Calcular ganancia de un producto
 * @param {Number} precioVenta - Precio de venta
 * @param {Number} precioCompra - Precio de compra
 * @returns {Number} - Ganancia
 */
export const calcularGanancia = (precioVenta, precioCompra) => {
  const venta = parseFloat(precioVenta) || 0;
  const compra = parseFloat(precioCompra) || 0;
  return venta - compra;
};

/**
 * Calcular porcentaje de ganancia
 * @param {Number} precioVenta - Precio de venta
 * @param {Number} precioCompra - Precio de compra
 * @returns {Number} - Porcentaje de ganancia (0-1)
 */
export const calcularPorcentajeGanancia = (precioVenta, precioCompra) => {
  const venta = parseFloat(precioVenta) || 0;
  const compra = parseFloat(precioCompra) || 0;
  
  if (compra === 0) return 0;
  
  return (venta - compra) / compra;
};

/**
 * Calcular margen de ganancia
 * @param {Number} precioVenta - Precio de venta
 * @param {Number} precioCompra - Precio de compra
 * @returns {Number} - Margen de ganancia (0-1)
 */
export const calcularMargen = (precioVenta, precioCompra) => {
  const venta = parseFloat(precioVenta) || 0;
  const compra = parseFloat(precioCompra) || 0;
  
  if (venta === 0) return 0;
  
  return (venta - compra) / venta;
};

/**
 * Validar si hay suficiente stock
 * @param {Object} producto - Producto
 * @param {Number} cantidad - Cantidad solicitada
 * @returns {Boolean} - true si hay suficiente stock
 */
export const validarStock = (producto, cantidad) => {
  if (!producto) return false;
  
  const stockActual = parseFloat(producto.stock_actual) || 0;
  const cantidadSolicitada = parseFloat(cantidad) || 0;
  
  return stockActual >= cantidadSolicitada;
};

/**
 * Verificar si un producto está en stock bajo
 * @param {Object} producto - Producto
 * @returns {Boolean} - true si está en stock bajo
 */
export const esStockBajo = (producto) => {
  if (!producto) return false;
  
  const stockActual = parseFloat(producto.stock_actual) || 0;
  const stockMinimo = parseFloat(producto.stock_minimo) || 0;
  
  return stockActual <= stockMinimo;
};

/**
 * Calcular total de un carrito
 * @param {Array} items - Items del carrito
 * @returns {Number} - Total
 */
export const calcularTotalCarrito = (items) => {
  if (!Array.isArray(items)) return 0;
  
  return items.reduce((total, item) => {
    const precio = parseFloat(item.precio || item.precio_unitario) || 0;
    const cantidad = parseFloat(item.cantidad) || 0;
    return total + (precio * cantidad);
  }, 0);
};

/**
 * Calcular subtotal de un item
 * @param {Number} precio - Precio unitario
 * @param {Number} cantidad - Cantidad
 * @returns {Number} - Subtotal
 */
export const calcularSubtotal = (precio, cantidad) => {
  const p = parseFloat(precio) || 0;
  const c = parseFloat(cantidad) || 0;
  return p * c;
};

/**
 * Calcular IVA (16%)
 * @param {Number} monto - Monto base
 * @param {Number} tasaIVA - Tasa de IVA (default: 0.16)
 * @returns {Number} - IVA calculado
 */
export const calcularIVA = (monto, tasaIVA = 0.16) => {
  const m = parseFloat(monto) || 0;
  return m * tasaIVA;
};

/**
 * Calcular monto con IVA incluido
 * @param {Number} monto - Monto base
 * @param {Number} tasaIVA - Tasa de IVA (default: 0.16)
 * @returns {Number} - Monto con IVA
 */
export const calcularMontoConIVA = (monto, tasaIVA = 0.16) => {
  const m = parseFloat(monto) || 0;
  return m * (1 + tasaIVA);
};

/**
 * Calcular descuento
 * @param {Number} monto - Monto original
 * @param {Number} porcentajeDescuento - Porcentaje de descuento (0-100)
 * @returns {Number} - Monto con descuento
 */
export const calcularDescuento = (monto, porcentajeDescuento) => {
  const m = parseFloat(monto) || 0;
  const desc = parseFloat(porcentajeDescuento) || 0;
  return m * (1 - desc / 100);
};

/**
 * Generar folio único
 * @param {String} prefijo - Prefijo del folio
 * @returns {String} - Folio generado
 */
export const generarFolio = (prefijo = 'FOL') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefijo}-${timestamp}-${random}`;
};

/**
 * Generar código aleatorio
 * @param {Number} length - Longitud del código
 * @returns {String} - Código generado
 */
export const generarCodigo = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Validar email
 * @param {String} email - Email a validar
 * @returns {Boolean} - true si es válido
 */
export const validarEmail = (email) => {
  if (!email) return false;
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validar teléfono mexicano
 * @param {String} phone - Teléfono a validar
 * @returns {Boolean} - true si es válido
 */
export const validarTelefono = (phone) => {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

/**
 * Validar RFC
 * @param {String} rfc - RFC a validar
 * @returns {Boolean} - true si es válido
 */
export const validarRFC = (rfc) => {
  if (!rfc) return false;
  
  // RFC genérico: XAXX010101000
  if (rfc === 'XAXX010101000') return true;
  
  // RFC persona moral: 12 caracteres
  // RFC persona física: 13 caracteres
  const regex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
  return regex.test(rfc.toUpperCase());
};

/**
 * Validar código postal mexicano
 * @param {String} zipCode - Código postal
 * @returns {Boolean} - true si es válido
 */
export const validarCodigoPostal = (zipCode) => {
  if (!zipCode) return false;
  
  const cleaned = zipCode.replace(/\D/g, '');
  return cleaned.length === 5;
};

/**
 * Validar número positivo
 * @param {Number} num - Número a validar
 * @returns {Boolean} - true si es positivo
 */
export const esNumeroPositivo = (num) => {
  const n = parseFloat(num);
  return !isNaN(n) && n > 0;
};

/**
 * Validar rango de número
 * @param {Number} num - Número a validar
 * @param {Number} min - Valor mínimo
 * @param {Number} max - Valor máximo
 * @returns {Boolean} - true si está en rango
 */
export const estaEnRango = (num, min, max) => {
  const n = parseFloat(num);
  return !isNaN(n) && n >= min && n <= max;
};

/**
 * Obtener fecha de inicio del día
 * @param {Date} date - Fecha (default: hoy)
 * @returns {Date} - Fecha inicio del día
 */
export const obtenerInicioDia = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Obtener fecha de fin del día
 * @param {Date} date - Fecha (default: hoy)
 * @returns {Date} - Fecha fin del día
 */
export const obtenerFinDia = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Obtener fecha de inicio del mes
 * @param {Date} date - Fecha (default: hoy)
 * @returns {Date} - Fecha inicio del mes
 */
export const obtenerInicioMes = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Obtener fecha de fin del mes
 * @param {Date} date - Fecha (default: hoy)
 * @returns {Date} - Fecha fin del mes
 */
export const obtenerFinMes = (date = new Date()) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Calcular días entre fechas
 * @param {Date} fecha1 - Primera fecha
 * @param {Date} fecha2 - Segunda fecha
 * @returns {Number} - Días de diferencia
 */
export const calcularDiasEntre = (fecha1, fecha2) => {
  const d1 = new Date(fecha1);
  const d2 = new Date(fecha2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Verificar si una fecha es hoy
 * @param {Date|String} date - Fecha a verificar
 * @returns {Boolean} - true si es hoy
 */
export const esHoy = (date) => {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const hoy = new Date();
  
  return d.getDate() === hoy.getDate() &&
         d.getMonth() === hoy.getMonth() &&
         d.getFullYear() === hoy.getFullYear();
};

/**
 * Verificar si una fecha es de esta semana
 * @param {Date|String} date - Fecha a verificar
 * @returns {Boolean} - true si es de esta semana
 */
export const esEstaSemana = (date) => {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const hoy = new Date();
  
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());
  inicioSemana.setHours(0, 0, 0, 0);
  
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 6);
  finSemana.setHours(23, 59, 59, 999);
  
  return d >= inicioSemana && d <= finSemana;
};

/**
 * Verificar si una fecha es de este mes
 * @param {Date|String} date - Fecha a verificar
 * @returns {Boolean} - true si es de este mes
 */
export const esEsteMes = (date) => {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const hoy = new Date();
  
  return d.getMonth() === hoy.getMonth() &&
         d.getFullYear() === hoy.getFullYear();
};

/**
 * Agrupar array por propiedad
 * @param {Array} array - Array a agrupar
 * @param {String} key - Propiedad por la cual agrupar
 * @returns {Object} - Objeto agrupado
 */
export const agruparPor = (array, key) => {
  if (!Array.isArray(array)) return {};
  
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Ordenar array por propiedad
 * @param {Array} array - Array a ordenar
 * @param {String} key - Propiedad por la cual ordenar
 * @param {String} order - 'asc' o 'desc'
 * @returns {Array} - Array ordenado
 */
export const ordenarPor = (array, key, order = 'asc') => {
  if (!Array.isArray(array)) return [];
  
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filtrar array por búsqueda en múltiples campos
 * @param {Array} array - Array a filtrar
 * @param {String} searchTerm - Término de búsqueda
 * @param {Array} fields - Campos donde buscar
 * @returns {Array} - Array filtrado
 */
export const filtrarPorBusqueda = (array, searchTerm, fields) => {
  if (!Array.isArray(array) || !searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(term);
    });
  });
};

/**
 * Eliminar duplicados de array
 * @param {Array} array - Array con posibles duplicados
 * @param {String} key - Propiedad única (opcional)
 * @returns {Array} - Array sin duplicados
 */
export const eliminarDuplicados = (array, key = null) => {
  if (!Array.isArray(array)) return [];
  
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }
  
  return [...new Set(array)];
};

/**
 * Sumar valores de una propiedad en array
 * @param {Array} array - Array de objetos
 * @param {String} key - Propiedad a sumar
 * @returns {Number} - Suma total
 */
export const sumarPropiedad = (array, key) => {
  if (!Array.isArray(array)) return 0;
  
  return array.reduce((sum, item) => {
    const value = parseFloat(item[key]) || 0;
    return sum + value;
  }, 0);
};

/**
 * Obtener promedio de una propiedad en array
 * @param {Array} array - Array de objetos
 * @param {String} key - Propiedad
 * @returns {Number} - Promedio
 */
export const promedioPropiedad = (array, key) => {
  if (!Array.isArray(array) || array.length === 0) return 0;
  
  const sum = sumarPropiedad(array, key);
  return sum / array.length;
};

/**
 * Copiar texto al portapapeles
 * @param {String} text - Texto a copiar
 * @returns {Promise} - Promesa
 */
export const copiarAlPortapapeles = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return { success: true, message: 'Texto copiado' };
    } else {
      // Fallback para navegadores antiguos
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return { success: true, message: 'Texto copiado' };
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return { success: false, message: 'Error al copiar' };
  }
};

/**
 * Descargar archivo
 * @param {String} content - Contenido del archivo
 * @param {String} filename - Nombre del archivo
 * @param {String} mimeType - Tipo MIME
 */
export const descargarArchivo = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Esperar X milisegundos (útil para delays)
 * @param {Number} ms - Milisegundos a esperar
 * @returns {Promise} - Promesa
 */
export const esperar = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generar color aleatorio
 * @returns {String} - Color en formato hexadecimal
 */
export const generarColorAleatorio = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Obtener iniciales de un nombre
 * @param {String} nombre - Nombre completo
 * @returns {String} - Iniciales
 */
export const obtenerIniciales = (nombre) => {
  if (!nombre) return '';
  
  const palabras = nombre.trim().split(' ');
  if (palabras.length === 1) {
    return palabras[0].substring(0, 2).toUpperCase();
  }
  
  return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
};

/**
 * Verificar si un objeto está vacío
 * @param {Object} obj - Objeto a verificar
 * @returns {Boolean} - true si está vacío
 */
export const esObjetoVacio = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * Deep clone de un objeto
 * @param {Object} obj - Objeto a clonar
 * @returns {Object} - Objeto clonado
 */
export const clonarObjeto = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export default {
  calcularGanancia,
  calcularPorcentajeGanancia,
  calcularMargen,
  validarStock,
  esStockBajo,
  calcularTotalCarrito,
  calcularSubtotal,
  calcularIVA,
  calcularMontoConIVA,
  calcularDescuento,
  generarFolio,
  generarCodigo,
  validarEmail,
  validarTelefono,
  validarRFC,
  validarCodigoPostal,
  esNumeroPositivo,
  estaEnRango,
  obtenerInicioDia,
  obtenerFinDia,
  obtenerInicioMes,
  obtenerFinMes,
  calcularDiasEntre,
  esHoy,
  esEstaSemana,
  esEsteMes,
  agruparPor,
  ordenarPor,
  filtrarPorBusqueda,
  eliminarDuplicados,
  sumarPropiedad,
  promedioPropiedad,
  copiarAlPortapapeles,
  descargarArchivo,
  esperar,
  generarColorAleatorio,
  obtenerIniciales,
  esObjetoVacio,
  clonarObjeto
};