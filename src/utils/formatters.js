// src/utils/formatters.js

/**
 * Formatear número como moneda mexicana
 * @param {Number} amount - Cantidad a formatear
 * @param {String} currency - Código de moneda (default: MXN)
 * @returns {String} - Cantidad formateada
 */
export const formatCurrency = (amount, currency = 'MXN') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formatear número como moneda simple (sin símbolo)
 * @param {Number} amount - Cantidad a formatear
 * @returns {String} - Cantidad formateada
 */
export const formatNumber = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }
  
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

/**
 * Formatear fecha en formato corto
 * @param {Date|String} date - Fecha a formatear
 * @returns {String} - Fecha formateada (dd/mm/yyyy)
 */
export const formatDate = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Formatear fecha en formato largo
 * @param {Date|String} date - Fecha a formatear
 * @returns {String} - Fecha formateada (1 de enero de 2024)
 */
export const formatDateLong = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Formatear fecha con hora
 * @param {Date|String} date - Fecha a formatear
 * @returns {String} - Fecha y hora formateada
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

/**
 * Formatear solo la hora
 * @param {Date|String} date - Fecha a formatear
 * @returns {String} - Hora formateada (HH:MM:SS)
 */
export const formatTime = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
};

/**
 * Formatear hora corta (sin segundos)
 * @param {Date|String} date - Fecha a formatear
 * @returns {String} - Hora formateada (HH:MM)
 */
export const formatTimeShort = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return dateObj.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '-';
  }
};

/**
 * Formatear porcentaje
 * @param {Number} value - Valor decimal (0.15 = 15%)
 * @param {Number} decimals - Decimales a mostrar
 * @returns {String} - Porcentaje formateado
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Formatear número de teléfono mexicano
 * @param {String} phone - Número de teléfono
 * @returns {String} - Teléfono formateado
 */
export const formatPhone = (phone) => {
  if (!phone) return '-';
  
  // Remover todo excepto números
  const cleaned = phone.replace(/\D/g, '');
  
  // Formato: (XXX) XXX-XXXX o XXX-XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

/**
 * Formatear RFC
 * @param {String} rfc - RFC
 * @returns {String} - RFC formateado en mayúsculas
 */
export const formatRFC = (rfc) => {
  if (!rfc) return '-';
  return rfc.toUpperCase().trim();
};

/**
 * Formatear texto a título (Primera Letra Mayúscula)
 * @param {String} text - Texto a formatear
 * @returns {String} - Texto formateado
 */
export const formatTitle = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formatear texto a mayúsculas
 * @param {String} text - Texto a formatear
 * @returns {String} - Texto en mayúsculas
 */
export const formatUpperCase = (text) => {
  if (!text) return '';
  return text.toUpperCase();
};

/**
 * Formatear texto a minúsculas
 * @param {String} text - Texto a formatear
 * @returns {String} - Texto en minúsculas
 */
export const formatLowerCase = (text) => {
  if (!text) return '';
  return text.toLowerCase();
};

/**
 * Formatear tamaño de archivo
 * @param {Number} bytes - Tamaño en bytes
 * @returns {String} - Tamaño formateado
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Formatear tiempo relativo (hace X minutos)
 * @param {Date|String} date - Fecha
 * @returns {String} - Tiempo relativo
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Hace un momento';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `Hace ${diffInMonths} mes${diffInMonths !== 1 ? 'es' : ''}`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `Hace ${diffInYears} año${diffInYears !== 1 ? 's' : ''}`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '-';
  }
};

/**
 * Formatear duración en segundos a formato legible
 * @param {Number} seconds - Segundos
 * @returns {String} - Duración formateada
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

/**
 * Formatear número con separadores de miles
 * @param {Number} num - Número
 * @returns {String} - Número formateado
 */
export const formatThousands = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Truncar texto con puntos suspensivos
 * @param {String} text - Texto
 * @param {Number} maxLength - Longitud máxima
 * @returns {String} - Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Formatear dirección IP
 * @param {String} ip - Dirección IP
 * @returns {String} - IP formateada
 */
export const formatIP = (ip) => {
  if (!ip) return '-';
  return ip.trim();
};

/**
 * Formatear código postal
 * @param {String} zipCode - Código postal
 * @returns {String} - Código postal formateado
 */
export const formatZipCode = (zipCode) => {
  if (!zipCode) return '-';
  
  const cleaned = zipCode.replace(/\D/g, '');
  
  if (cleaned.length === 5) {
    return cleaned;
  }
  
  return zipCode;
};

/**
 * Formatear número de tarjeta (ocultar dígitos)
 * @param {String} cardNumber - Número de tarjeta
 * @returns {String} - Número de tarjeta parcialmente oculto
 */
export const formatCardNumber = (cardNumber) => {
  if (!cardNumber) return '-';
  
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (cleaned.length >= 16) {
    return `**** **** **** ${cleaned.slice(-4)}`;
  }
  
  return cardNumber;
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateLong,
  formatDateTime,
  formatTime,
  formatTimeShort,
  formatPercent,
  formatPhone,
  formatRFC,
  formatTitle,
  formatUpperCase,
  formatLowerCase,
  formatFileSize,
  formatRelativeTime,
  formatDuration,
  formatThousands,
  truncateText,
  formatIP,
  formatZipCode,
  formatCardNumber
};