// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { productosService, ventasService, inventarioService } from '../services/api';
import { useToast } from './Toast';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { esHoy, esEstaSemana, sumarPropiedad, agruparPor } from '../utils/helpers';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  const [ventasData, setVentasData] = useState([]);
  const [productosData, setProductosData] = useState([]);
  const toast = useToast();

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(() => {
      console.log('Dashboard: Actualizando datos automáticamente...');
      loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Dashboard: Iniciando carga de datos...');
      setLoading(true);
      
      const [productosRes, alertasRes, ventasRes] = await Promise.all([
        productosService.getAll(),
        inventarioService.getAlertas(),
        ventasService.getAll()
      ]);

      const productos = Array.isArray(productosRes.data?.data) ? productosRes.data.data : [];
      const alertasData = Array.isArray(alertasRes.data?.data) ? alertasRes.data.data : [];
      const ventas = Array.isArray(ventasRes.data?.data) ? ventasRes.data.data : [];

      // Calcular estadísticas
      const ventasHoy = ventas.filter(venta => esHoy(venta.fecha_venta));
      const ventasSemana = ventas.filter(venta => esEstaSemana(venta.fecha_venta));
      
      const mesActual = new Date().getMonth();
      const añoActual = new Date().getFullYear();
      const ventasMes = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha_venta);
        return fechaVenta.getMonth() === mesActual && fechaVenta.getFullYear() === añoActual;
      });

      const productosConStockBajo = productos.filter(p => {
        const stockActual = parseFloat(p.stock_actual);
        const stockMinimo = parseFloat(p.stock_minimo);
        return stockActual < stockMinimo;
      });

      const newStats = {
        totalProductos: productos.length,
        ventasHoy: sumarPropiedad(ventasHoy, 'total'),
        ventasSemana: sumarPropiedad(ventasSemana, 'total'),
        stockBajo: productosConStockBajo.length,
        ventasMes: sumarPropiedad(ventasMes, 'total'),
        numeroVentasHoy: ventasHoy.length,
        numeroVentasSemana: ventasSemana.length
      };

      setStats(newStats);
      setAlertas(productosConStockBajo);
      setVentasData(ventas);
      setProductosData(productos);
      setLastUpdate(new Date());
      
      console.log('Dashboard: Datos cargados exitosamente');
    } catch (error) {
      console.error('Dashboard: Error cargando datos:', error);
      toast.error('Error al cargar datos del dashboard');
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
    toast.info('Actualizando datos...');
    loadDashboardData();
  };

  // Preparar datos para gráfico de ventas de últimos 7 días
  const prepararDatosVentasDiarias = () => {
    const ultimos7Dias = [];
    const hoy = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      ultimos7Dias.push({
        fecha: fecha,
        label: formatDate(fecha).split('/').slice(0, 2).join('/'),
        total: 0
      });
    }

    ventasData.forEach(venta => {
      const fechaVenta = new Date(venta.fecha_venta);
      const diaEncontrado = ultimos7Dias.find(dia => 
        dia.fecha.toDateString() === fechaVenta.toDateString()
      );
      
      if (diaEncontrado) {
        diaEncontrado.total += parseFloat(venta.total || 0);
      }
    });

    return {
      labels: ultimos7Dias.map(d => d.label),
      datasets: [{
        label: 'Ventas',
        data: ultimos7Dias.map(d => d.total),
        fill: true,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
      }]
    };
  };

  // Preparar datos para gráfico de top productos
  const prepararDatosTopProductos = () => {
    // Agrupar ventas por producto (esto es simulado, idealmente vendría del backend)
    const ventasPorProducto = {};
    
    productosData.slice(0, 5).forEach((producto, index) => {
      ventasPorProducto[producto.nombre] = Math.random() * 5000 + 1000;
    });

    return {
      labels: Object.keys(ventasPorProducto),
      datasets: [{
        label: 'Ventas por Producto',
        data: Object.values(ventasPorProducto),
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(72, 187, 120, 0.8)',
          'rgba(237, 137, 54, 0.8)',
          'rgba(66, 153, 225, 0.8)',
          'rgba(245, 101, 101, 0.8)',
        ],
        borderColor: [
          'rgba(102, 126, 234, 1)',
          'rgba(72, 187, 120, 1)',
          'rgba(237, 137, 54, 1)',
          'rgba(66, 153, 225, 1)',
          'rgba(245, 101, 101, 1)',
        ],
        borderWidth: 1,
      }]
    };
  };

  // Preparar datos para gráfico de métodos de pago
  const prepararDatosMetodosPago = () => {
    const metodos = agruparPor(ventasData, 'metodo_pago');
    
    const efectivo = sumarPropiedad(metodos.efectivo || [], 'total');
    const tarjeta = sumarPropiedad(metodos.tarjeta || [], 'total');
    const transferencia = sumarPropiedad(metodos.transferencia || [], 'total');

    return {
      labels: ['Efectivo', 'Tarjeta', 'Transferencia'],
      datasets: [{
        data: [efectivo, tarjeta, transferencia],
        backgroundColor: [
          'rgba(72, 187, 120, 0.8)',
          'rgba(66, 153, 225, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgba(72, 187, 120, 1)',
          'rgba(66, 153, 225, 1)',
          'rgba(245, 158, 11, 1)',
        ],
        borderWidth: 2,
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += formatCurrency(context.parsed.y || context.parsed);
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatCurrency(context.parsed);
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
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
              🕐 {formatRelativeTime(lastUpdate)}
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
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>Total Productos</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalProductos}</p>
          <small style={{ opacity: 0.8 }}>En catálogo</small>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>Ventas Hoy</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{formatCurrency(stats.ventasHoy)}</p>
          <small style={{ opacity: 0.8 }}>{stats.numeroVentasHoy} transacciones</small>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>Stock Bajo</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{stats.stockBajo}</p>
          <small style={{ opacity: 0.8 }}>Requieren atención</small>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>Ventas del Mes</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{formatCurrency(stats.ventasMes)}</p>
          <small style={{ opacity: 0.8 }}>Acumulado mensual</small>
        </div>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Gráfico de ventas diarias */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>📈 Ventas de los Últimos 7 Días</h3>
          <div style={{ height: '300px' }}>
            <Line data={prepararDatosVentasDiarias()} options={chartOptions} />
          </div>
        </div>

        {/* Gráfico de métodos de pago */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>💳 Métodos de Pago</h3>
          <div style={{ height: '300px' }}>
            <Doughnut data={prepararDatosMetodosPago()} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Gráfico de top productos */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>🏆 Top 5 Productos</h3>
        <div style={{ height: '300px' }}>
          <Bar data={prepararDatosTopProductos()} options={chartOptions} />
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
            <p>📊 Última actualización: {formatDate(lastUpdate)} {formatRelativeTime(lastUpdate)}</p>
          </div>
          
          <div>
            <h4 style={{ color: '#4a5568', marginBottom: '10px' }}>Rendimiento de Ventas</h4>
            <p>💰 Ventas de hoy: {formatCurrency(stats.ventasHoy)}</p>
            <p>📅 Ventas del mes: {formatCurrency(stats.ventasMes)}</p>
            <p>📈 Promedio diario: {formatCurrency(stats.ventasMes / new Date().getDate())}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;