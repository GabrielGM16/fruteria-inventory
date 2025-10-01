import React, { useState, useEffect } from 'react';
import { productosService, ventasService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProductos: 0,
    ventasHoy: 0,
    stockBajo: 0,
    ventasMes: 0
  });
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas básicas
      const [productosRes, alertasRes, ventasRes] = await Promise.all([
        productosService.getAll(),
        productosService.getAlertas(),
        ventasService.getAll()
      ]);

      const productos = productosRes.data;
      const alertasData = alertasRes.data;
      const ventas = ventasRes.data;

      // Calcular estadísticas
      const hoy = new Date().toDateString();
      const ventasHoy = ventas.filter(venta => 
        new Date(venta.fecha_venta).toDateString() === hoy
      );
      
      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();
      const ventasMes = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha_venta);
        return fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === añoActual;
      });

      setStats({
        totalProductos: productos.length,
        ventasHoy: ventasHoy.reduce((sum, venta) => sum + parseFloat(venta.total), 0),
        stockBajo: productos.filter(p => p.stock_actual <= p.stock_minimo).length,
        ventasMes: ventasMes.reduce((sum, venta) => sum + parseFloat(venta.total), 0)
      });

      setAlertas(alertasData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Panel de control - Frutería</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Total Productos</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalProductos}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Ventas Hoy</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>${stats.ventasHoy.toFixed(2)}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Stock Bajo</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.stockBajo}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Ventas del Mes</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>${stats.ventasMes.toFixed(2)}</p>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {alertas.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0, color: '#e53e3e' }}>⚠️ Alertas de Stock Bajo</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {alertas.map((producto) => (
              <div key={producto.id} className="alert alert-warning" style={{ marginBottom: '10px' }}>
                <strong>{producto.nombre}</strong> - Stock actual: {producto.stock_actual} {producto.unidad_medida}
                <br />
                <small>Stock mínimo: {producto.stock_minimo} {producto.unidad_medida}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>🚀 Acciones Rápidas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/inventario'}
            style={{ padding: '15px', fontSize: '1rem' }}
          >
            📦 Gestionar Inventario
          </button>
          
          <button 
            className="btn btn-success"
            onClick={() => window.location.href = '/ventas'}
            style={{ padding: '15px', fontSize: '1rem' }}
          >
            💰 Nueva Venta
          </button>
          
          <button 
            className="btn btn-warning"
            onClick={() => window.location.href = '/entradas'}
            style={{ padding: '15px', fontSize: '1rem' }}
          >
            📥 Registrar Entrada
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/estadisticas'}
            style={{ padding: '15px', fontSize: '1rem' }}
          >
            📈 Ver Reportes
          </button>
        </div>
      </div>

      {/* Información del sistema */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>ℹ️ Información del Sistema</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#4a5568', marginBottom: '10px' }}>Estado del Inventario</h4>
            <p>✅ Productos activos: {stats.totalProductos}</p>
            <p>⚠️ Productos con stock bajo: {stats.stockBajo}</p>
            <p>📊 Última actualización: {new Date().toLocaleString()}</p>
          </div>
          
          <div>
            <h4 style={{ color: '#4a5568', marginBottom: '10px' }}>Rendimiento de Ventas</h4>
            <p>💰 Ventas de hoy: ${stats.ventasHoy.toFixed(2)}</p>
            <p>📅 Ventas del mes: ${stats.ventasMes.toFixed(2)}</p>
            <p>📈 Promedio diario: ${(stats.ventasMes / new Date().getDate()).toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;