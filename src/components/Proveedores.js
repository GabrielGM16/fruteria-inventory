// src/components/Proveedores.js
import React, { useState, useEffect } from 'react';
import { proveedoresService } from '../services/api';
import { useToast } from './Toast';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetalle, setShowDetalle] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    rfc: '',
    productos_suministrados: '',
    notas: '',
    activo: true
  });

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  const loadProveedores = async () => {
    try {
      setLoading(true);
      const response = await proveedoresService.getAll();
      const proveedoresData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      setProveedores(proveedoresData);
    } catch (error) {
      console.error('Error loading proveedores:', error);
      toast.error('Error al cargar proveedores');
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProveedor) {
        await proveedoresService.update(editingProveedor.id, formData);
        toast.success('Proveedor actualizado exitosamente');
      } else {
        await proveedoresService.create(formData);
        toast.success('Proveedor creado exitosamente');
      }
      
      setShowModal(false);
      setEditingProveedor(null);
      resetForm();
      loadProveedores();
    } catch (error) {
      console.error('Error saving proveedor:', error);
      toast.error('Error al guardar proveedor');
    }
  };

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      rfc: proveedor.rfc || '',
      productos_suministrados: proveedor.productos_suministrados || '',
      notas: proveedor.notas || '',
      activo: proveedor.activo !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
      try {
        await proveedoresService.delete(id);
        toast.success('Proveedor eliminado exitosamente');
        loadProveedores();
      } catch (error) {
        console.error('Error deleting proveedor:', error);
        toast.error('Error al eliminar proveedor');
      }
    }
  };

  const toggleActivo = async (id, activo) => {
    try {
      await proveedoresService.update(id, { activo: !activo });
      toast.success(`Proveedor ${!activo ? 'activado' : 'desactivado'}`);
      loadProveedores();
    } catch (error) {
      console.error('Error updating proveedor:', error);
      toast.error('Error al actualizar proveedor');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      rfc: '',
      productos_suministrados: '',
      notas: '',
      activo: true
    });
  };

  const filteredProveedores = Array.isArray(proveedores) 
    ? proveedores.filter(proveedor =>
        proveedor.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.contacto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.productos_suministrados?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const proveedoresActivos = filteredProveedores.filter(p => p.activo !== false);
  const proveedoresInactivos = filteredProveedores.filter(p => p.activo === false);

  if (loading) {
    return <div className="loading">Cargando proveedores...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">👥 Gestión de Proveedores</h1>
        <p className="page-subtitle">Administración de proveedores y contactos</p>
      </div>

      {/* Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Total Proveedores</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{proveedores.length}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Activos</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{proveedoresActivos.length}</p>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Inactivos</h3>
          <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>{proveedoresInactivos.length}</p>
        </div>
      </div>

      {/* Controles superiores */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '300px' }}
          />
          
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingProveedor(null);
              resetForm();
              setShowModal(true);
            }}
          >
            ➕ Nuevo Proveedor
          </button>
        </div>
      </div>

      {/* Lista de proveedores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredProveedores.map((proveedor) => (
          <div 
            key={proveedor.id} 
            className="card"
            style={{
              border: `2px solid ${proveedor.activo !== false ? '#e2e8f0' : '#fed7d7'}`,
              opacity: proveedor.activo !== false ? 1 : 0.7
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>
                  {proveedor.nombre}
                  {proveedor.activo === false && (
                    <span style={{ 
                      marginLeft: '10px', 
                      fontSize: '0.8rem', 
                      color: '#e53e3e',
                      backgroundColor: '#fed7d7',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      Inactivo
                    </span>
                  )}
                </h3>
                {proveedor.contacto && (
                  <p style={{ margin: '5px 0', color: '#718096', fontSize: '0.9rem' }}>
                    👤 {proveedor.contacto}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleActivo(proveedor.id, proveedor.activo)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '5px'
                }}
                title={proveedor.activo !== false ? 'Desactivar' : 'Activar'}
              >
                {proveedor.activo !== false ? '🟢' : '🔴'}
              </button>
            </div>

            <div style={{ marginBottom: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              {proveedor.telefono && (
                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                  📞 {proveedor.telefono}
                </p>
              )}
              {proveedor.email && (
                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                  📧 {proveedor.email}
                </p>
              )}
              {proveedor.rfc && (
                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                  🆔 RFC: {proveedor.rfc}
                </p>
              )}
              {proveedor.productos_suministrados && (
                <p style={{ margin: '10px 0 5px 0', fontSize: '0.9rem', color: '#4a5568' }}>
                  <strong>Suministra:</strong> {proveedor.productos_suministrados}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '15px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowDetalle(proveedor)}
                style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}
              >
                👁️ Ver Detalle
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleEdit(proveedor)}
                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
              >
                ✏️
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(proveedor.id)}
                style={{ padding: '8px 12px', fontSize: '0.9rem' }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProveedores.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📦</div>
          <h3 style={{ margin: '0 0 10px 0' }}>No hay proveedores registrados</h3>
          <p style={{ margin: '0 0 20px 0' }}>Comienza agregando tu primer proveedor</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingProveedor(null);
              resetForm();
              setShowModal(true);
            }}
          >
            ➕ Agregar Proveedor
          </button>
        </div>
      )}

      {/* Modal de formulario */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>
              {editingProveedor ? '✏️ Editar Proveedor' : '➕ Nuevo Proveedor'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del Proveedor *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                  placeholder="Ej: Distribuidora de Frutas SA"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Persona de Contacto</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contacto}
                    onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    placeholder="Ej: 442-123-4567"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="contacto@proveedor.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">RFC</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.rfc}
                    onChange={(e) => setFormData({...formData, rfc: e.target.value.toUpperCase()})}
                    placeholder="XAXX010101000"
                    maxLength="13"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Calle, número, colonia, ciudad"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Productos que Suministra</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.productos_suministrados}
                  onChange={(e) => setFormData({...formData, productos_suministrados: e.target.value})}
                  placeholder="Ej: Frutas, verduras, granos"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea
                  className="form-input"
                  value={formData.notas}
                  onChange={(e) => setFormData({...formData, notas: e.target.value})}
                  rows="3"
                  placeholder="Información adicional sobre el proveedor..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  />
                  <span>Proveedor activo</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProveedor(null);
                    resetForm();
                  }}
                  style={{ backgroundColor: '#e2e8f0', color: '#4a5568' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {showDetalle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, color: '#2d3748' }}>
              👁️ Detalle del Proveedor
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>{showDetalle.nombre}</h4>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  backgroundColor: showDetalle.activo !== false ? '#c6f6d5' : '#fed7d7',
                  color: showDetalle.activo !== false ? '#276749' : '#c53030'
                }}>
                  {showDetalle.activo !== false ? '✅ Activo' : '❌ Inactivo'}
                </span>
              </div>

              {showDetalle.contacto && (
                <p style={{ margin: '10px 0' }}>
                  <strong>👤 Contacto:</strong> {showDetalle.contacto}
                </p>
              )}
              
              {showDetalle.telefono && (
                <p style={{ margin: '10px 0' }}>
                  <strong>📞 Teléfono:</strong> {showDetalle.telefono}
                </p>
              )}
              
              {showDetalle.email && (
                <p style={{ margin: '10px 0' }}>
                  <strong>📧 Email:</strong> {showDetalle.email}
                </p>
              )}
              
              {showDetalle.rfc && (
                <p style={{ margin: '10px 0' }}>
                  <strong>🆔 RFC:</strong> {showDetalle.rfc}
                </p>
              )}
              
              {showDetalle.direccion && (
                <p style={{ margin: '10px 0' }}>
                  <strong>📍 Dirección:</strong> {showDetalle.direccion}
                </p>
              )}
              
              {showDetalle.productos_suministrados && (
                <p style={{ margin: '10px 0' }}>
                  <strong>📦 Productos:</strong> {showDetalle.productos_suministrados}
                </p>
              )}
              
              {showDetalle.notas && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f7fafc', borderRadius: '6px' }}>
                  <strong>📝 Notas:</strong>
                  <p style={{ margin: '5px 0 0 0' }}>{showDetalle.notas}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                className="btn"
                onClick={() => setShowDetalle(null)}
                style={{ backgroundColor: '#e2e8f0', color: '#4a5568' }}
              >
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleEdit(showDetalle);
                  setShowDetalle(null);
                }}
              >
                ✏️ Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;