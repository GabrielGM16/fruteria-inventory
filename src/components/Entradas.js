import React, { useState, useEffect } from 'react';
import { entradasService, productosService } from '../services/api';

const Entradas = () => {
  const [entradas, setEntradas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    precio_compra: '',
    proveedor: '',
    nota: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Entradas: Iniciando carga de datos...');
      setLoading(true);
      const [entradasResponse, productosResponse] = await Promise.all([
        entradasService.getAll(),
        productosService.getAll()
      ]);
      
      console.log('Entradas: Respuesta entradas:', entradasResponse);
      console.log('Entradas: Respuesta productos:', productosResponse);
      
      // Corregir acceso a los datos - usar response.data.data
      const entradasData = Array.isArray(entradasResponse.data?.data) ? entradasResponse.data.data : [];
      const productosData = Array.isArray(productosResponse.data?.data) ? productosResponse.data.data : [];
      
      console.log('Entradas: Datos entradas procesados:', entradasData);
      console.log('Entradas: Datos productos procesados:', productosData);
      
      setEntradas(entradasData);
      setProductos(productosData);
      
      console.log('Entradas: Datos cargados exitosamente');
    } catch (error) {
      console.error('Entradas: Error cargando datos:', error);
      alert('Error al cargar datos');
      // En caso de error, asegurar que sean arrays vacíos
      setEntradas([]);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Entradas: Datos del formulario a enviar:', formData);
      
      if (editingEntrada) {
        await entradasService.update(editingEntrada.id, formData);
        alert('Entrada actualizada exitosamente');
      } else {
        await entradasService.create(formData);
        alert('Entrada registrada exitosamente');
      }
      
      setShowModal(false);
      setEditingEntrada(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving entrada:', error);
      console.error('Error details:', error.response?.data);
      alert('Error al guardar entrada');
    }
  };

  const handleEdit = (entrada) => {
    setEditingEntrada(entrada);
    setFormData({
      producto_id: entrada.producto_id,
      cantidad: entrada.cantidad,
      precio_compra: entrada.precio_compra,
      proveedor: entrada.proveedor || '',
      nota: entrada.nota || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta entrada? Esta acción no se puede deshacer.')) {
      try {
        await entradasService.delete(id);
        alert('Entrada eliminada exitosamente');
        loadData();
      } catch (error) {
        console.error('Error deleting entrada:', error);
        alert('Error al eliminar entrada');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      producto_id: '',
      cantidad: '',
      precio_compra: '',
      proveedor: '',
      nota: ''
    });
  };

  const getProductoName = (productoId) => {
    const producto = Array.isArray(productos) ? productos.find(p => p.id === productoId) : null;
    return producto ? producto.nombre : 'Producto no encontrado';
  };

  const filteredEntradas = Array.isArray(entradas) ? entradas.filter(entrada => {
    const producto = Array.isArray(productos) ? productos.find(p => p.id === entrada.producto_id) : null;
    const matchesSearch = producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entrada.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entrada.nota?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter === '' || 
                       entrada.fecha_entrada.startsWith(dateFilter);
    
    return matchesSearch && matchesDate;
  }) : [];

  const totalEntradas = Array.isArray(filteredEntradas) ? filteredEntradas.reduce((sum, entrada) => sum + parseFloat(entrada.cantidad), 0) : 0;
  const totalValor = Array.isArray(filteredEntradas) ? filteredEntradas.reduce((sum, entrada) => 
    sum + (parseFloat(entrada.cantidad) * parseFloat(entrada.precio_compra)), 0) : 0;

  if (loading) {
    return <div className="loading">Cargando entradas...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Entradas de Mercancía</h1>
        <p className="page-subtitle">Registro y control de mercancía recibida</p>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card">
          <h3 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>Total Entradas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#2d3748' }}>
            {filteredEntradas.length}
          </p>
        </div>
        
        <div className="card">
          <h3 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>Cantidad Total</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#38a169' }}>
            {totalEntradas.toFixed(2)}
          </p>
        </div>
        
        <div className="card">
          <h3 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>Valor Total</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#3182ce' }}>
            ${totalValor.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Controles superiores */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar por producto, proveedor o factura..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: '300px' }}
            />
            
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
              style={{ width: '150px' }}
            />
            
            {(searchTerm || dateFilter) && (
              <button
                className="btn"
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                }}
                style={{ backgroundColor: '#e2e8f0', color: '#4a5568' }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
          
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingEntrada(null);
              resetForm();
              setShowModal(true);
            }}
          >
            ➕ Nueva Entrada
          </button>
        </div>
      </div>

      {/* Tabla de entradas */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio de Compra</th>
                <th>Total</th>
                <th>Proveedor</th>
                <th>Nota</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntradas.map((entrada) => {
                const total = parseFloat(entrada.cantidad) * parseFloat(entrada.precio_compra);
                return (
                  <tr key={entrada.id}>
                    <td>
                      {new Date(entrada.fecha_entrada).toLocaleDateString('es-ES')}
                    </td>
                    <td>
                      <strong>{getProductoName(entrada.producto_id)}</strong>
                    </td>
                    <td>{parseFloat(entrada.cantidad).toFixed(2)}</td>
                    <td>${parseFloat(entrada.precio_compra).toFixed(2)}</td>
                    <td>
                      <strong>${total.toFixed(2)}</strong>
                    </td>
                    <td>{entrada.proveedor || '-'}</td>
                    <td>{entrada.nota || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEdit(entrada)}
                          style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(entrada.id)}
                          style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredEntradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {searchTerm || dateFilter ? 'No se encontraron entradas con los filtros aplicados' : 'No hay entradas registradas'}
          </div>
        )}
      </div>

      {/* Modal para crear/editar entrada */}
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>
              {editingEntrada ? 'Editar Entrada' : 'Nueva Entrada'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Producto *</label>
                <select
                  className="form-input"
                  value={formData.producto_id}
                  onChange={(e) => setFormData({...formData, producto_id: e.target.value})}
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {Array.isArray(productos) ? productos.filter(p => p.activo).map(producto => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - {producto.categoria}
                    </option>
                  )) : []}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Cantidad *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio de Compra *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.precio_compra}
                    onChange={(e) => setFormData({...formData, precio_compra: e.target.value})}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              {formData.cantidad && formData.precio_compra && (
                <div className="alert alert-success">
                  <strong>Total: ${(parseFloat(formData.cantidad || 0) * parseFloat(formData.precio_compra || 0)).toFixed(2)}</strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.proveedor}
                  onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nota</label>
                <textarea
                  className="form-input"
                  value={formData.nota}
                  onChange={(e) => setFormData({...formData, nota: e.target.value})}
                  placeholder="Notas adicionales..."
                  rows="3"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEntrada(null);
                    resetForm();
                  }}
                  style={{ backgroundColor: '#e2e8f0', color: '#4a5568' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEntrada ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Entradas;