import React, { useState, useEffect } from 'react';
import { productosService } from '../services/api';

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    unidad_medida: 'kg',
    precio_compra: '',
    precio_venta: '',
    stock_actual: '',
    stock_minimo: '',
    imagen_url: '',
    activo: true
  });

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const response = await productosService.getAll();
      setProductos(response.data);
    } catch (error) {
      console.error('Error loading productos:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productosService.update(editingProduct.id, formData);
        alert('Producto actualizado exitosamente');
      } else {
        await productosService.create(formData);
        alert('Producto creado exitosamente');
      }
      
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProductos();
    } catch (error) {
      console.error('Error saving producto:', error);
      alert('Error al guardar producto');
    }
  };

  const handleEdit = (producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      categoria: producto.categoria,
      unidad_medida: producto.unidad_medida,
      precio_compra: producto.precio_compra,
      precio_venta: producto.precio_venta,
      stock_actual: producto.stock_actual,
      stock_minimo: producto.stock_minimo,
      imagen_url: producto.imagen_url || '',
      activo: producto.activo
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productosService.delete(id);
        alert('Producto eliminado exitosamente');
        loadProductos();
      } catch (error) {
        console.error('Error deleting producto:', error);
        alert('Error al eliminar producto');
      }
    }
  };

  const handleStockUpdate = async (id, newStock) => {
    try {
      await productosService.updateStock(id, newStock);
      alert('Stock actualizado exitosamente');
      loadProductos();
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error al actualizar stock');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      categoria: '',
      unidad_medida: 'kg',
      precio_compra: '',
      precio_venta: '',
      stock_actual: '',
      stock_minimo: '',
      imagen_url: '',
      activo: true
    });
  };

  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || producto.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(productos.map(p => p.categoria))];

  if (loading) {
    return <div className="loading">Cargando inventario...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Inventario</h1>
        <p className="page-subtitle">Gestión de productos y stock</p>
      </div>

      {/* Controles superiores */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: '250px' }}
            />
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-input"
              style={{ width: '150px' }}
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setShowModal(true);
            }}
          >
            ➕ Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Unidad</th>
                <th>Precio Compra</th>
                <th>Precio Venta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.map((producto) => (
                <tr key={producto.id} style={{ 
                  backgroundColor: producto.stock_actual <= producto.stock_minimo ? '#fef5e7' : 'transparent'
                }}>
                  <td>
                    <strong>{producto.nombre}</strong>
                    {producto.stock_actual <= producto.stock_minimo && (
                      <span style={{ color: '#ed8936', fontSize: '0.8rem', display: 'block' }}>
                        ⚠️ Stock bajo
                      </span>
                    )}
                  </td>
                  <td>{producto.categoria}</td>
                  <td>
                    <input
                      type="number"
                      value={producto.stock_actual}
                      onChange={(e) => handleStockUpdate(producto.id, e.target.value)}
                      style={{ width: '80px', padding: '5px', border: '1px solid #ddd', borderRadius: '4px' }}
                      step="0.01"
                    />
                  </td>
                  <td>{producto.stock_minimo}</td>
                  <td>{producto.unidad_medida}</td>
                  <td>${parseFloat(producto.precio_compra || 0).toFixed(2)}</td>
                  <td>${parseFloat(producto.precio_venta).toFixed(2)}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      backgroundColor: producto.activo ? '#c6f6d5' : '#fed7d7',
                      color: producto.activo ? '#276749' : '#c53030'
                    }}>
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEdit(producto)}
                        style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(producto.id)}
                        style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProductos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Modal para crear/editar producto */}
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
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.categoria}
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  placeholder="frutas, verduras, etc."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unidad de Medida</label>
                <select
                  className="form-input"
                  value={formData.unidad_medida}
                  onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                >
                  <option value="kg">Kilogramos</option>
                  <option value="unidad">Unidad</option>
                  <option value="caja">Caja</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Precio Compra</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.precio_compra}
                    onChange={(e) => setFormData({...formData, precio_compra: e.target.value})}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio Venta *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({...formData, precio_venta: e.target.value})}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Stock Actual</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({...formData, stock_actual: e.target.value})}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stock Mínimo</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({...formData, stock_minimo: e.target.value})}
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">URL de Imagen</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({...formData, imagen_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  />
                  Producto activo
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  style={{ backgroundColor: '#e2e8f0', color: '#4a5568' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;