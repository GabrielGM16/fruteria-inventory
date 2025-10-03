import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de Productos
export const productosService = {
  getAll: () => api.get('/productos'),
  getById: (id) => api.get(`/productos/${id}`),
  create: (producto) => api.post('/productos', producto),
  update: (id, producto) => api.put(`/productos/${id}`, producto),
  delete: (id) => api.delete(`/productos/${id}`),
};

// Servicios de Inventario (separado)
export const inventarioService = {
  updateStock: (id, stock) => api.put(`/inventario/${id}/stock`, { stock }),
  getAlertas: () => api.get('/inventario/alertas'),
};

// Servicios de Entradas
export const entradasService = {
  getAll: () => api.get('/entradas'),
  getById: (id) => api.get(`/entradas/${id}`),
  create: (entrada) => api.post('/entradas', entrada),
  update: (id, entrada) => api.put(`/entradas/${id}`, entrada),
  delete: (id) => api.delete(`/entradas/${id}`),
  getProveedores: () => api.get('/proveedores'),
};

// Servicios de Ventas
export const ventasService = {
  getAll: () => api.get('/ventas'),
  create: (venta) => api.post('/ventas', venta),
  getHistorial: (params) => api.get('/ventas/historial', { params }),
};

// Servicios de Mermas
export const mermasService = {
  getAll: () => api.get('/mermas'),
  create: (merma) => api.post('/mermas', merma),
  getReportes: () => api.get('/mermas/reportes'),
};

// Servicios de Estadísticas
export const estadisticasService = {
  getVentas: (params) => api.get('/estadisticas/ventas', { params }),
  getProductos: () => api.get('/estadisticas/productos'),
  getDashboard: () => api.get('/estadisticas/dashboard'),
  getResumen: (fechaInicio, fechaFin) => api.get('/estadisticas/resumen', { 
    params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } 
  }),
  getReportesPDF: (tipo) => api.get(`/reportes/pdf?tipo=${tipo}`, { 
    responseType: 'blob' 
  }),
};

// Servicios de Autenticación
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  },
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
  getCurrentUser: () => api.get('/auth/me'),
};
// Agregar al final de src/services/api.js

// Servicios de Proveedores
export const proveedoresService = {
  getAll: () => api.get('/proveedores'),
  getById: (id) => api.get(`/proveedores/${id}`),
  create: (proveedor) => api.post('/proveedores', proveedor),
  update: (id, proveedor) => api.put(`/proveedores/${id}`, proveedor),
  delete: (id) => api.delete(`/proveedores/${id}`),
  getHistorialCompras: (id) => api.get(`/proveedores/${id}/compras`),
};

export default api;