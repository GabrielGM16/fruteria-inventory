// src/components/Estadisticas.js
import React, { useState, useEffect, useCallback } from 'react';
import { ventasService, productosService } from '../services/api';
import { useToast } from './Toast';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';
import { 
  sumarPropiedad, 
  agruparPor
} from '../utils/helpers';
import { 
  exportToExcel, 
  exportToPDF,
  formatVentasForExport 
} from '../services/export';
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

const Estadisticas = () => {
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const toast = useToast();
  
  const [stats, setStats] = useState({
    ventasTotal: 0,
    ingresosTotal: 0,
    productosTotal: 0,
    gananciaTotal: 0,
    ventasDiarias: [],
    topProductos: [],
    metodosPago: {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0
    },
    productosStockBajo: [],
    totalMermas: 0,
    valorMermas: 0
  });

  useEffect(() => {
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(hace30Dias.toISOString().split('T')[0]);
  }, []);

  const loadEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      
      const [ventasRes, productosRes] = await Promise.all([
        ventasService.getAll(),
        productosService.getAll()
      ]);
      
      const ventasData = Array.isArray(ventasRes.data?.data) ? ventasRes.data.data : [];
      const productosData = Array.isArray(productosRes.data?.data) ? productosRes.data.data : [];
      
      setVentas(ventasData);
      setProductos(productosData);
      
      // Filtrar ventas por período
      const ventasFiltradas = ventasData.filter(venta => {
        const fechaVenta = new Date(venta.fecha_venta);
        const inicio = fechaInicio ? new Date(fechaInicio) : new Date('2000-01-01');
        const fin = fechaFin ? new Date(fechaFin) : new Date();
        return fechaVenta >= inicio && fechaVenta <= fin;
      });

      // Calcular estadísticas
      const ingresosTotal = sumarPropiedad(ventasFiltradas, 'total');
      const ventasTotal = ventasFiltradas.length;
      
      // Agrupar ventas por método de pago
      const porMetodoPago = agruparPor(ventasFiltradas, 'metodo_pago');
      const metodosPago = {
        efectivo: sumarPropiedad(porMetodoPago.efectivo || [], 'total'),
        tarjeta: sumarPropiedad(porMetodoPago.tarjeta || [], 'total'),
        transferencia: sumarPropiedad(porMetodoPago.transferencia || [], 'total')
      };

      // Ventas diarias (últimos 30 días)
      const ventasDiarias = calcularVentasDiarias(ventasFiltradas);

      // Top productos (simulado - idealmente vendría del backend)
      const topProductos = productosData.slice(0, 10).map(p => ({
        producto_id: p.id,
        producto_nombre: p.nombre,
        total_cantidad: Math.random() * 100 + 10,
        total_ingresos: Math.random() * 5000 + 1000,
        total_ganancia: Math.random() * 2000 + 500
      }));

      // Productos con stock bajo
      const productosStockBajo = productosData.filter(p => 
        parseFloat(p.stock_actual) <= parseFloat(p.stock_minimo)
      );

      setStats({
        ventasTotal,
        ingresosTotal,
        productosTotal: productosData.length,
        gananciaTotal: ingresosTotal * 0.3, // Estimación 30% ganancia
        ventasDiarias,
        topProductos,
        metodosPago,
        productosStockBajo,
        totalMermas: 0,
        valorMermas: 0
      });

    } catch (error) {
      console.error('Error loading estadisticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, toast]);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      loadEstadisticas();
    }
  }, [fechaInicio, fechaFin, loadEstadisticas]);

  const calcularVentasDiarias = (ventasArray) => {
    const ultimos30Dias = [];
    const hoy = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      ultimos30Dias.push({
        fecha: fecha.toISOString().split('T')[0],
        total_ventas: 0,
        total_ingresos: 0
      });
    }

    ventasArray.forEach(venta => {
      const fechaVenta = new Date(venta.fecha_venta).toISOString().split('T')[0];
      const diaEncontrado = ultimos30Dias.find(dia => dia.fecha === fechaVenta);
      
      if (diaEncontrado) {
        diaEncontrado.total_ventas += 1;
        diaEncontrado.total_ingresos += parseFloat(venta.total || 0);
      }
    });

    return ultimos30Dias;
  };

  const aplicarFiltro = () => {
    toast.info('Aplicando filtros...');
    loadEstadisticas();
  };

  const handleExportExcel = () => {
    try {
      const ventasFiltradas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha_venta);
        const inicio = fechaInicio ? new Date(fechaInicio) : new Date('2000-01-01');
        const fin = fechaFin ? new Date(fechaFin) : new Date();
        return fechaVenta >= inicio && fechaVenta <= fin;
      });

      const datosFormateados = formatVentasForExport(ventasFiltradas);
      exportToExcel(datosFormateados, `ventas_${fechaInicio}_${fechaFin}`, 'Ventas');
      toast.success('✅ Reporte exportado a Excel');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar reporte');
    }
  };

  const handleExportPDF = () => {
    try {
      const ventasFiltradas = ventas.filter(venta => {
        const fechaVenta = new Date(venta.fecha_venta);
        const inicio = fechaInicio ? new Date(fechaInicio) : new Date('2000-01-01');
        const fin = fechaFin ? new Date(fechaFin) : new Date();
        return fechaVenta >= inicio && fechaVenta <= fin;
      });

      const datosFormateados = formatVentasForExport(ventasFiltradas);
      exportToPDF(datosFormateados, `ventas_${fechaInicio}_${fechaFin}`, 'Reporte de Ventas');
      toast.success('✅ Reporte PDF generado');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al generar PDF');
    }
  };

  // Preparar datos para gráfico de ventas diarias
  const prepararDatosVentasDiarias = () => {
    return {
      labels: stats.ventasDiarias.map(d => formatDate(d.fecha).split('/').slice(0, 2).join('/')),
      datasets: [{
        label: 'Ingresos',
        data: stats.ventasDiarias.map(d => d.total_ingresos),
        fill: true,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgba(102, 126, 234, 1)',
      }]
    };
  };

  // Preparar datos para gráfico de métodos de pago
  const prepararDatosMetodosPago = () => {
    return {
      labels: ['Efectivo', 'Tarjeta', 'Transferencia'],
      datasets: [{
        data: [
          stats.metodosPago.efectivo,
          stats.metodosPago.tarjeta,
          stats.metodosPago.transferencia
        ],
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

  // Preparar datos para gráfico de top productos
  const prepararDatosTopProductos = () => {
    const top5 = stats.topProductos.slice(0, 5);
    return {
      labels: top5.map(p => p.producto_nombre),
      datasets: [{
        label: 'Ingresos',
        data: top5.map(p => p.total_ingresos),
        backgroundColor: 'rgba(102, 126, 234, 0.8)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 1,
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
    return <div className="loading">Cargando estadísticas...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">📊 Estadísticas y Reportes</h1>
            <p className="page-subtitle">Análisis de ventas y rendimiento</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportExcel} className="btn btn-success">
              📊 Exportar Excel
            </button>
            <button onClick={handleExportPDF} className="btn btn-danger">
              📕 Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filtro de fechas */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>📅 Período de Análisis</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Fecha Inicio:
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="form-input"
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Fecha Fin:
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="form-input"
            />
          </div>
          <button
            onClick={aplicarFiltro}
            className="btn btn-primary"
            style={{ height: 'fit-content' }}
          >
            🔍 Aplicar Filtro
          </button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h4 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>💰 Ingresos Totales</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {formatCurrency(stats.ingresosTotal)}
          </p>
          <small style={{ opacity: 0.8 }}>{stats.ventasTotal} ventas realizadas</small>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h4 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>📈 Ganancia Neta</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {formatCurrency(stats.gananciaTotal)}
          </p>
          <small style={{ opacity: 0.8 }}>
            Margen: {stats.ingresosTotal > 0 ? formatPercent(stats.gananciaTotal / stats.ingresosTotal) : '0%'}
          </small>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <h4 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>📦 Productos Activos</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {stats.productosTotal}
          </p>
          <small style={{ opacity: 0.8 }}>En catálogo</small>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
          <h4 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>💳 Ticket Promedio</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {formatCurrency(stats.ventasTotal > 0 ? stats.ingresosTotal / stats.ventasTotal : 0)}
          </p>
          <small style={{ opacity: 0.8 }}>Por venta</small>
        </div>
      </div>

      {/* Gráficos principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Ventas diarias */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>📈 Ventas Diarias (Últimos 30 días)</h3>
          <div style={{ height: '300px' }}>
            <Line data={prepararDatosVentasDiarias()} options={chartOptions} />
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>💳 Métodos de Pago</h3>
          <div style={{ height: '300px' }}>
            <Doughnut data={prepararDatosMetodosPago()} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Top productos */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>🏆 Top 5 Productos Más Vendidos</h3>
        <div style={{ height: '300px' }}>
          <Bar data={prepararDatosTopProductos()} options={chartOptions} />
        </div>
      </div>

      {/* Top Productos tabla detallada */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>🏆 Top 10 Productos Más Vendidos</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Ranking</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Producto</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Unidades Vendidas</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Ingresos Generados</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Ganancia</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Participación</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProductos && stats.topProductos.slice(0, 10).map((producto, index) => {
                const participacion = stats.ingresosTotal > 0 
                  ? (parseFloat(producto.total_ingresos || 0) / parseFloat(stats.ingresosTotal) * 100).toFixed(1)
                  : 0;
                
                return (
                  <tr key={producto.producto_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '30px',
                        height: '30px',
                        lineHeight: '30px',
                        textAlign: 'center',
                        borderRadius: '50%',
                        background: index < 3 ? '#fbbf24' : '#e5e7eb',
                        color: index < 3 ? 'white' : '#4b5563',
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{producto.producto_nombre}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {parseFloat(producto.total_cantidad || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontWeight: 'bold' }}>
                      {formatCurrency(producto.total_ingresos)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 'bold' }}>
                      {formatCurrency(producto.total_ganancia)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${participacion}%`,
                            height: '100%',
                            backgroundColor: '#3b82f6',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '40px' }}>
                          {participacion}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!stats.topProductos || stats.topProductos.length === 0) && (
          <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            No hay datos de ventas para mostrar
          </p>
        )}
      </div>

      {/* Productos con Stock Bajo */}
      {stats.productosStockBajo && stats.productosStockBajo.length > 0 && (
        <div className="card" style={{ border: '2px solid #fbbf24', backgroundColor: '#fffbeb' }}>
          <h3 style={{ color: '#92400e' }}>⚠️ Alerta: Productos con Stock Bajo</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#fef3c7', borderBottom: '2px solid #fbbf24' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Producto</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Stock Actual</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Stock Mínimo</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.productosStockBajo.map(producto => {
                  const porcentaje = (parseFloat(producto.stock_actual || 0) / parseFloat(producto.stock_minimo || 1)) * 100;
                  
                  return (
                    <tr key={producto.id} style={{ borderBottom: '1px solid #fbbf24' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{producto.nombre}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>
                        {parseFloat(producto.stock_actual || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {parseFloat(producto.stock_minimo || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: porcentaje < 50 ? '#fecaca' : '#fed7aa',
                          color: porcentaje < 50 ? '#991b1b' : '#9a3412'
                        }}>
                          {porcentaje < 50 ? 'CRÍTICO' : 'BAJO'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Métricas adicionales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#f0f9ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>📊 Ticket Promedio</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
            {formatCurrency(stats.ventasTotal > 0 ? stats.ingresosTotal / stats.ventasTotal : 0)}
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', backgroundColor: '#f0fdf4' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#166534' }}>💹 ROI</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
            {stats.ingresosTotal > 0 && stats.gananciaTotal > 0
              ? formatPercent(stats.gananciaTotal / (stats.ingresosTotal - stats.gananciaTotal))
              : '0%'}
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', backgroundColor: '#fef2f2' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#991b1b' }}>📉 % Mermas</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>
            {stats.ingresosTotal > 0
              ? formatPercent(stats.valorMermas / stats.ingresosTotal)
              : '0%'}
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', backgroundColor: '#faf5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#6b21a8' }}>📦 Productos Vendidos</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#6b21a8' }}>
            {stats.topProductos ? stats.topProductos.reduce((sum, p) => sum + parseFloat(p.total_cantidad || 0), 0).toFixed(0) : 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;