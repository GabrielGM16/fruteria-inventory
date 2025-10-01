import React, { useState, useEffect } from 'react';
import { ventasService, productosService } from '../services/api';

const Estadisticas = () => {
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [stats, setStats] = useState({
    // Resumen general
    ventasTotal: 0,
    ingresosTotal: 0,
    productosTotal: 0,
    gananciaTotal: 0,
    
    // Ventas diarias
    ventasDiarias: [],
    
    // Top productos
    topProductos: [],
    
    // Métodos de pago
    metodosPago: {
      efectivo: 0,
      tarjeta: 0,
      mixto: 0
    },
    
    // Productos bajo stock
    productosStockBajo: [],
    
    // Comparativa
    totalMermas: 0,
    valorMermas: 0
  });

  useEffect(() => {
    // Configurar fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    
    setFechaFin(hoy.toISOString().split('T')[0]);
    setFechaInicio(hace30Dias.toISOString().split('T')[0]);
    
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Llamar al endpoint de estadísticas del backend
      const response = await ventasService.getEstadisticas(fechaInicio, fechaFin);
      
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading estadisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltro = () => {
    loadEstadisticas();
  };

  const formatMoney = (valor) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor || 0);
  };

  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📊 Estadísticas y Reportes</h1>
        <p className="page-subtitle">Análisis de ventas y rendimiento</p>
      </div>

      {/* Filtro de fechas */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>📅 Período de Análisis</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
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
          <div style={{ flex: 1 }}>
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
            {formatMoney(stats.ingresosTotal)}
          </p>
          <small style={{ opacity: 0.8 }}>{stats.ventasTotal} ventas realizadas</small>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h4 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>📈 Ganancia Neta</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {formatMoney(stats.gananciaTotal)}
          </p>
          <small style={{ opacity: 0.8 }}>
            Margen: {stats.ingresosTotal > 0 ? ((stats.gananciaTotal / stats.ingresosTotal) * 100).toFixed(1) : 0}%
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
          <h4 style={{ margin: '0 0 10px 0', opacity: 0.9 }}>⚠️ Mermas</h4>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
            {formatMoney(stats.valorMermas)}
          </p>
          <small style={{ opacity: 0.8 }}>{stats.totalMermas} unidades perdidas</small>
        </div>
      </div>

      {/* Top Productos Más Vendidos */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>🏆 Top 10 Productos Más Vendidos</h3>
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
                  ? ((producto.total_ingresos / stats.ingresosTotal) * 100).toFixed(1)
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
                      {parseFloat(producto.total_cantidad).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontWeight: 'bold' }}>
                      {formatMoney(producto.total_ingresos)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#2563eb', fontWeight: 'bold' }}>
                      {formatMoney(producto.total_ganancia)}
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Ventas Diarias */}
        <div className="card">
          <h3>📅 Ventas Diarias</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Ventas</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Ingresos</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {stats.ventasDiarias && stats.ventasDiarias.slice(0, 15).map((dia, index) => {
                  const diaAnterior = stats.ventasDiarias[index + 1];
                  const tendencia = diaAnterior 
                    ? ((dia.total_ingresos - diaAnterior.total_ingresos) / diaAnterior.total_ingresos) * 100
                    : 0;
                  
                  return (
                    <tr key={dia.fecha} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px' }}>
                        {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-MX', { 
                          weekday: 'short', 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                        {dia.total_ventas}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                        {formatMoney(dia.total_ingresos)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {diaAnterior && (
                          <span style={{ 
                            color: tendencia > 0 ? '#059669' : tendencia < 0 ? '#dc2626' : '#6b7280',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {tendencia > 0 ? '↑' : tendencia < 0 ? '↓' : '→'} {Math.abs(tendencia).toFixed(1)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!stats.ventasDiarias || stats.ventasDiarias.length === 0) && (
            <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              No hay ventas registradas en este período
            </p>
          )}
        </div>

        {/* Métodos de Pago */}
        <div className="card">
          <h3>💳 Métodos de Pago</h3>
          <div style={{ marginTop: '20px' }}>
            {Object.entries(stats.metodosPago).map(([metodo, monto]) => {
              const total = Object.values(stats.metodosPago).reduce((a, b) => a + b, 0);
              const porcentaje = total > 0 ? ((monto / total) * 100).toFixed(1) : 0;
              
              const colores = {
                efectivo: '#10b981',
                tarjeta: '#3b82f6',
                mixto: '#f59e0b'
              };
              
              const iconos = {
                efectivo: '💵',
                tarjeta: '💳',
                mixto: '🔄'
              };
              
              return (
                <div key={metodo} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {iconos[metodo]} {metodo}
                    </span>
                    <span style={{ fontWeight: 'bold', color: colores[metodo] }}>
                      {formatMoney(monto)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '12px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${porcentaje}%`,
                      height: '100%',
                      backgroundColor: colores[metodo],
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <small style={{ color: '#6b7280' }}>{porcentaje}% del total</small>
                </div>
              );
            })}
          </div>
        </div>
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
                  const porcentaje = (producto.stock_actual / producto.stock_minimo) * 100;
                  
                  return (
                    <tr key={producto.id} style={{ borderBottom: '1px solid #fbbf24' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{producto.nombre}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>
                        {parseFloat(producto.stock_actual).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {parseFloat(producto.stock_minimo).toFixed(2)}
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

      {/* Promedios y Métricas Adicionales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#f0f9ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>📊 Ticket Promedio</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af' }}>
            {formatMoney(stats.ventasTotal > 0 ? stats.ingresosTotal / stats.ventasTotal : 0)}
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', backgroundColor: '#f0fdf4' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#166534' }}>💹 ROI</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
            {stats.ingresosTotal > 0 && stats.gananciaTotal > 0
              ? ((stats.gananciaTotal / (stats.ingresosTotal - stats.gananciaTotal)) * 100).toFixed(1)
              : 0}%
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', backgroundColor: '#fef2f2' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#991b1b' }}>📉 % Mermas</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#991b1b' }}>
            {stats.ingresosTotal > 0
              ? ((stats.valorMermas / stats.ingresosTotal) * 100).toFixed(2)
              : 0}%
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', backgroundColor: '#faf5ff' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#6b21a8' }}>📦 Productos Vendidos</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#6b21a8' }}>
            {stats.topProductos ? stats.topProductos.reduce((sum, p) => sum + parseFloat(p.total_cantidad), 0).toFixed(0) : 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;