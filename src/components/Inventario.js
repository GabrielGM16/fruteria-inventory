// src/components/Inventario.js
import React, { useState, useEffect } from 'react';
import { productosService } from '../services/api';
import { useToast } from './Toast';
import { formatCurrency, formatDate } from '../utils/formatters';
import { calcularGanancia, esStockBajo, validarStock } from '../utils/helpers';
import { 
  exportToExcel, 
  exportToCSV, 
  exportInventarioToPDF,
  formatProductosForExport 
} from '../services/export';

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const toast = useToast();

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
      setProductos(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error('Error loading productos:', error);
      toast.error('Error al cargar productos');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productosService.update(editingProduct.id, formData);
        toast.success('Producto actualizado exitosamente');
      } else {
        await productosService.create(formData);
        toast.success('Producto creado exitosamente');
      }
      
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProductos();
    } catch (error) {
      console.error('Error saving producto:', error);
      toast.error('Error al guardar producto');
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
        toast.success('Producto eliminado exitosamente');
        loadProductos();
      } catch (error) {
        console.error('Error deleting producto:', error);
        toast.error('Error al eliminar producto');
      }
    }
  };

  const handleStockUpdate = async (id, newStock) => {
    try {
      await productosService.updateStock(id, newStock);
      toast.success('Stock actualizado exitosamente');
      loadProductos();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Error al actualizar stock');
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

  // Funciones de exportación
  const handleExportExcel = () => {
    try {
      const datosFormateados = formatProductosForExport(filteredProductos);
      const result = exportToExcel(datosFormateados, 'inventario', 'Productos');
      if (result.success) {
        toast.success('✅ Inventario exportado a Excel');
      } else {
        toast.error('Error al exportar a Excel');
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error al exportar a Excel');
    }
  };

  const handleExportCSV = () => {
    try {
      const datosFormateados = formatProductosForExport(filteredProductos);
      const result = exportToCSV(datosFormateados, 'inventario');
      if (result.success) {
        toast.success('✅ Inventario exportado a CSV');
      } else {
        toast.error('Error al exportar a CSV');
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Error al exportar a CSV');
    }
  };

  const handleExportPDF = () => {
    try {
      const stats = {
        totalProductos: filteredProductos.length,
        stockBajo: filteredProductos.filter(p => esStockBajo(p)).length,
        valorTotal: filteredProductos.reduce((sum, p) => 
          sum + (parseFloat(p.stock_actual) * parseFloat(p.precio_venta)), 0
        )
      };
      const result = exportInventarioToPDF(filteredProductos, stats);
      if (result.success) {
        toast.success('✅ Reporte PDF generado');
      } else {
        toast.error('Error al generar PDF');
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Error al generar PDF');
    }
  };

  const filteredProductos = Array.isArray(productos) ? productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === '' || producto.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  const categories = Array.isArray(productos) ? [...new Set(productos.map(p => p.categoria))] : [];

  // Calcular estadísticas
  const productosActivos = filteredProductos.filter(p => p.activo);
  const productosStockBajo = filteredProductos.filter(p => esStockBajo(p));
  const valorTotalInventario = filteredProductos.reduce((sum, p) => 
    sum + (parseFloat(p.stock_actual || 0) * parseFloat(p.precio_venta || 0)), 0
  );

  if (loading) {
    return <div className="loading">Cargando inventario...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">📦 Inventario</h1>
        <p className="page-subtitle">Gestión de productos y stock</p>
      </div>

      {/* Estadísticas rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Productos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{filteredProductos.length}</div>
        </div>
        
        <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Productos Activos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{productosActivos.length}</div>
        </div>
        
        <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Stock Bajo</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{productosStockBajo.length}</div>
        </div>
        
        <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', color: 'white' }}>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Valor Total</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{formatCurrency(valorTotalInventario)}</div>
        </div>
      </div>

      {/* Controles superiores */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
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
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleExportExcel} className="btn btn-success" style={{ padding: '8px 16px' }}>
              📊 Excel
            </button>
            <button onClick={handleExportCSV} className="btn btn-primary" style={{ padding: '8px 16px' }}>
              📄 CSV
            </button>
            <button onClick={handleExportPDF} className="btn btn-danger" style={{ padding: '8px 16px' }}>
              📕 PDF
            </button>
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
                <th>Ganancia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.map((producto) => {
                const ganancia = calcularGanancia(producto.precio_venta, producto.precio_compra);
                const stockBajo = esStockBajo(producto);
                
                return (
                  <tr key={producto.id} style={{ 
                    backgroundColor: stockBajo ? '#fef5e7' : 'transparent'
                  }}>
                    <td>
                      <strong>{producto.nombre}</strong>
                      {stockBajo && (
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
                    <td>{formatCurrency(producto.precio_compra || 0)}</td>
                    <td>{formatCurrency(producto.precio_venta)}</td>
                    <td style={{ color: ganancia > 0 ? '#48bb78' : '#e53e3e', fontWeight: 'bold' }}>
                      {formatCurrency(ganancia)}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredProductos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            {searchTerm || filterCategory ? 'No se encontraron productos con los filtros aplicados' : 'No hay productos registrados'}
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
              {editingProduct ? '✏️ Editar Producto' : '➕ Nuevo Producto'}
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

              {formData.precio_compra && formData.precio_venta && (
                <div className="alert alert-success" style={{ marginBottom: '15px' }}>
                  <strong>Ganancia por unidad: {formatCurrency(calcularGanancia(formData.precio_venta, formData.precio_compra))}</strong>
                </div>
              )}

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