import React, { useState, useEffect } from 'react';
import { ventasService, productosService } from '../services/api';

const Estadisticas = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ventasTotal: 0,
    productosTotal: 0,
    ventasPorMes: [],
    topProductos: []
  });

  useEffect(() => {
    loadEstadisticas();
  }, []);

  const loadEstadisticas = async () => {
    try {
      setLoading(true);
      const [ventasRes, productosRes] = await Promise.all([
        ventasService.getAll(),
        productosService.getAll()
      ]);

      const ventas = ventasRes.data || [];
      const productos = productosRes.data || [];

      setStats({
        ventasTotal: ventas.length,
        productosTotal: productos.length,
        ventasPorMes: [],
        topProductos: []
      });
    } catch (error) {
      console.error('Error loading estadisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando estadísticas...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Estadísticas</h1>
        <p className="page-subtitle">Reportes y análisis de datos</p>
      </div>

      <div className="card">
        <h3>📊 Resumen General</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>Total Ventas</h4>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#3182ce' }}>
              {stats.ventasTotal}
            </p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f7fafc', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>Total Productos</h4>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#48bb78' }}>
              {stats.productosTotal}
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>🚧 Próximamente</h3>
        <p>Esta sección estará disponible próximamente con gráficos detallados y análisis avanzados.</p>
      </div>
    </div>
  );
};

export default Estadisticas;