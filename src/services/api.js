import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getProductos = async () => {
  const response = await api.get('/productos');
  return response.data;
};

export const getProducto = async (id) => {
  const response = await api.get(`/productos/${id}`);
  return response.data;
};

export const crearProducto = async (producto) => {
  const response = await api.post('/productos', producto);
  return response.data;
};

export const actualizarProducto = async (id, producto) => {
  const response = await api.put(`/productos/${id}`, producto);
  return response.data;
};

export const registrarEntrada = async (entrada) => {
  const response = await api.post('/entradas', entrada);
  return response.data;
};

export const registrarVenta = async (venta) => {
  const response = await api.post('/ventas', venta);
  return response.data;
};

export const registrarMerma = async (merma) => {
  const response = await api.post('/mermas', merma);
  return response.data;
};

export const getEstadisticas = async () => {
  const response = await api.get('/estadisticas');
  return response.data;
};

export const getVentasPorPeriodo = async (inicio, fin) => {
  const response = await api.get(`/ventas/periodo?inicio=${inicio}&fin=${fin}`);