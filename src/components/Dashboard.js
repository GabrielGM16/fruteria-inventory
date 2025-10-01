import React, { useState, useEffect } from 'react';
import { productosService, ventasService, inventarioService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProductos: 0,
    ventasHoy: 0,
    stockBajo: 0,
    ventasMes: 0
  });
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    // Configurar actualización automática cada 30 segundos
    const interval = setInterval(() => {
      console.log('Dashboard: Actualizando datos automáticamente...');
      loadDashboardData();
    }, 30000);

    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Dashboard: Iniciando carga de datos...');
      setLoading(true);
      
      // Cargar estadísticas básicas
      const [productosRes, alertasRes, ventasRes] = await Promise.all([
        productosService.getAll(),
        inventarioService.getAlertas(),
        ventasService.getAll()
      ]);

      console.log('Dashboard: Respuesta productos:', productosRes);
      console.log('Dashboard: Respuesta alertas:', alertasRes);
      console.log('Dashboard: Respuesta ventas:', ventasRes);

      // Corregir acceso a los datos - usar response.data.data
      const productos = Array.isArray(productosRes.data?.data) ? productosRes.data.data : [];
      const alertasData = Array.isArray(alertasRes.data?.data) ? alertasRes.data.data : [];
      const ventas = Array.isArray(ventasRes.data?.data) ? ventasRes.data.data : [];

      console.log('Dashboard: Productos procesados:', productos);
      console.log('Dashboard: Alertas procesadas:', alertasData);
      console.log('Dashboard: Ventas procesadas:', ventas);

      // Calcular estadísticas
      const hoy = new Date().toDateString();
      const ventasHoy = Array.isArray(ventas) ? ventas.filter(venta => 
        new Date(venta.fecha_venta).toDateString() === hoy
      ) : [];
      
      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();
      const ventasMes = Array.isArray(ventas) ? ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha_venta);
        return fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === añoActual;
      }) : [];

      const newStats = {
        totalProductos: Array.isArray(productos) ? productos.length : 0,
        ventasHoy: Array.isArray(ventasHoy) ? ventasHoy.reduce((sum, venta) => sum + parseFloat(venta.total), 0) : 0,
        stockBajo: Array.isArray(productos) ? productos.filter(p => p.stock_actual <= p.stock_minimo).length : 0,
        ventasMes: Array.isArray(ventasMes) ? ventasMes.reduce((sum, venta) => sum + parseFloat(venta.total), 0) : 0
      };

      console.log('Dashboard: Estadísticas calculadas:', newStats);
      setStats(newStats);
      setAlertas(Array.isArray(alertasData) ? alertasData : []);
      setLastUpdate(new Date());
      
      console.log('Dashboard: Datos cargados exitosamente');
    } catch (error) {
      console.error('Dashboard: Error cargando datos:', error);
      // Set default values in case of error
      setStats({
        totalProductos: 0,
        ventasHoy: 0,
        stockBajo: 0,
        ventasMes: 0
      });
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    console.log('Dashboard: Actualización manual solicitada');
    loadDashboardData();
  };

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Panel de control - Frutería</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </span>
            <button 
              className="btn btn-primary"
              onClick={handleManualRefresh}
              disabled={loading}
              style={{ padding: '8px 16px' }}
            >
              {loading ? '🔄 Actualizando...' : '🔄 Actualizar'}
            </button>
          </div>
        </div>
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
            <p>📊 Última actualización: {lastUpdate.toLocaleString()}</p>
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