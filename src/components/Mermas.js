import React, { useState, useEffect } from 'react';
import { productosService } from '../services/api';

const Mermas = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    motivo: '',
    observaciones: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const productosRes = await productosService.getAll();
      setProductos(Array.isArray(productosRes.data) ? productosRes.data : []);
    } catch (error) {
      console.error('Error loading data:', error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Aquí se implementaría el servicio de mermas
      alert('Funcionalidad de mermas próximamente disponible');
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error registering merma:', error);
      alert('Error al registrar merma');
    }
  };

  const resetForm = () => {
    setFormData({
      producto_id: '',
      cantidad: '',
      motivo: '',
      observaciones: ''
    });
  };

  if (loading) {
    return <div className="loading">Cargando mermas...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Control de Mermas</h1>
        <p className="page-subtitle">Registro y seguimiento de pérdidas</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
        >
          ➕ Registrar Merma
        </button>
      </div>

      <div className="card">
        <h3>📋 Historial de Mermas</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          🚧 Funcionalidad próximamente disponible
          <br />
          <small>Esta sección permitirá registrar y gestionar las mermas del inventario</small>
        </div>
      </div>

      {/* Modal para registrar merma */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Registrar Nueva Merma</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Producto:</label>
                <select
                  value={formData.producto_id}
                  onChange={(e) => setFormData({...formData, producto_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {Array.isArray(productos) && productos.map(producto => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Cantidad:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Motivo:</label>
                <select
                  value={formData.motivo}
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Seleccionar motivo</option>
                  <option value="vencimiento">Vencimiento</option>
                  <option value="daño">Daño físico</option>
                  <option value="deterioro">Deterioro</option>
                  <option value="robo">Robo/Pérdida</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Observaciones:</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  className="form-input"
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={{ backgroundColor: '#e2e8f0', color: '#4a5568' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Merma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mermas;