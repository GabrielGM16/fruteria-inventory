// src/components/Entradas.js
import React, { useState, useEffect } from 'react';
import { entradasService, productosService, proveedoresService } from '../services/api';
import { useToast } from './Toast';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  calcularSubtotal, 
  esNumeroPositivo,
  agruparPor,
  sumarPropiedad
} from '../utils/helpers';
import { 
  exportToExcel, 
  exportToCSV, 
  exportToPDF,
  formatEntradasForExport 
} from '../services/export';

const Entradas = () => {
  const [entradas, setEntradas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [proveedorFilter, setProveedorFilter] = useState('');
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    precio_compra: '',
    proveedor: '',
    nota: ''
  });

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
      
      const entradasData = Array.isArray(entradasResponse.data?.data) ? entradasResponse.data.data : [];
      const productosData = Array.isArray(productosResponse.data?.data) ? productosResponse.data.data : [];
      
      setEntradas(entradasData);
      setProductos(productosData);
      
      // Intentar cargar proveedores
      try {
        const proveedoresResponse = await proveedoresService.getAll();
        const proveedoresData = Array.isArray(proveedoresResponse.data?.data) 
          ? proveedoresResponse.data.data 
          : [];
        setProveedores(proveedoresData);
      } catch (error) {
        console.log('Proveedores no disponibles:', error);
        setProveedores([]);
      }
      
      console.log('Entradas: Datos cargados exitosamente');
    } catch (error) {
      console.error('Entradas: Error cargando datos:', error);
      toast.error('Error al cargar datos');
      setEntradas([]);
      setProductos([]);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.producto_id) {
      toast.warning('Seleccione un producto');
      return;
    }

    if (!esNumeroPositivo(formData.cantidad)) {
      toast.warning('Ingrese una cantidad válida');
      return;
    }

    if (!esNumeroPositivo(formData.precio_compra)) {
      toast.warning('Ingrese un precio de compra válido');
      return;
    }

    try {
      console.log('Entradas: Datos del formulario a enviar:', formData);
      
      const entradaData = {
        producto_id: parseInt(formData.producto_id),
        cantidad: parseFloat(formData.cantidad),
        precio_compra: parseFloat(formData.precio_compra),
        proveedor: formData.proveedor || null,
        nota: formData.nota || null
      };

      if (editingEntrada) {
        await entradasService.update(editingEntrada.id, entradaData);
        toast.success('✅ Entrada actualizada exitosamente');
      } else {
        await entradasService.create(entradaData);
        toast.success('✅ Entrada registrada exitosamente');
      }
      
      setShowModal(false);
      setEditingEntrada(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving entrada:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Error al guardar entrada');
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
        toast.success('✅ Entrada eliminada exitosamente');
        loadData();
      } catch (error) {
        console.error('Error deleting entrada:', error);
        toast.error('Error al eliminar entrada');
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

  const getProductoInfo = (productoId) => {
    return Array.isArray(productos) ? productos.find(p => p.id === productoId) : null;
  };

  const filteredEntradas = Array.isArray(entradas) ? entradas.filter(entrada => {
    const producto = getProductoInfo(entrada.producto_id);
    const matchesSearch = producto?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entrada.proveedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entrada.nota?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter === '' || 
                       entrada.fecha_entrada.startsWith(dateFilter);
    
    const matchesProveedor = proveedorFilter === '' ||
                            entrada.proveedor === proveedorFilter;
    
    return matchesSearch && matchesDate && matchesProveedor;
  }) : [];

  // Calcular estadísticas
  const totalEntradas = Array.isArray(filteredEntradas) ? filteredEntradas.length : 0;
  const cantidadTotal = Array.isArray(filteredEntradas) ? filteredEntradas.reduce((sum, entrada) => sum + parseFloat(entrada.cantidad), 0) : 0;
  const valorTotal = Array.isArray(filteredEntradas) ? filteredEntradas.reduce((sum, entrada) => 
    sum + (parseFloat(entrada.cantidad) * parseFloat(entrada.precio_compra)), 0) : 0;

  // Agrupar por proveedor
  const entradasPorProveedor = agruparPor(filteredEntradas, 'proveedor');
  const proveedoresUnicos = Object.keys(entradasPorProveedor).filter(p => p && p !== 'null');

  // Funciones de exportación
  const handleExportExcel = () => {
    try {
      const datosFormateados = formatEntradasForExport(filteredEntradas, productos);
      exportToExcel(datosFormateados, 'entradas', 'Entradas');
      toast.success('✅ Entradas exportadas a Excel');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar');
    }
  };

  const handleExportCSV = () => {
    try {
      const datosFormateados = formatEntradasForExport(filteredEntradas, productos);
      exportToCSV(datosFormateados, 'entradas');
      toast.success('✅ Entradas exportadas a CSV');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar');
    }
  };

  const handleExportPDF = () => {
    try {
      const datosFormateados = formatEntradasForExport(filteredEntradas, productos);
      exportToPDF(datosFormateados, 'entradas', 'Reporte de Entradas');
      toast.success('✅ Reporte PDF generado');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al generar PDF');
    }
  };

  if (loading) {
    return <div className="loading">Cargando entradas...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">📥 Entradas de Mercancía</h1>
            <p className="page-subtitle">Registro y control de mercancía recibida</p>
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
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>Total Entradas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            {totalEntradas}
          </p>
          <small style={{ opacity: 0.8 }}>Registros</small>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>Cantidad Total</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            {cantidadTotal.toFixed(2)}
          </p>
          <small style={{ opacity: 0.8 }}>Unidades</small>
        </div>
        
        <div className="card" style={{ background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', color: 'white', padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>Valor Total</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            {formatCurrency(valorTotal)}
          </p>
          <small style={{ opacity: 0.8 }}>Inversión</small>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)', color: 'white', padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', opacity: 0.9 }}>Proveedores</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            {proveedoresUnicos.length}
          </p>
          <small style={{ opacity: 0.8 }}>Activos</small>
        </div>
      </div>

      {/* Controles superiores */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Buscar por producto, proveedor o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ minWidth: '250px', flex: 1 }}
            />
            
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
              style={{ width: '150px' }}
            />

            {proveedoresUnicos.length > 0 && (
              <select
                value={proveedorFilter}
                onChange={(e) => setProveedorFilter(e.target.value)}
                className="form-input"
                style={{ width: '150px' }}
              >
                <option value="">Todos los proveedores</option>
                {proveedoresUnicos.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            )}
            
            {(searchTerm || dateFilter || proveedorFilter) && (
              <button
                className="btn"
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setProveedorFilter('');
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
                <th>ID</th>
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
                const producto = getProductoInfo(entrada.producto_id);
                const total = calcularSubtotal(entrada.precio_compra, entrada.cantidad);
                
                return (
                  <tr key={entrada.id}>
                    <td><strong>#{entrada.id}</strong></td>
                    <td>
                      {formatDate(entrada.fecha_entrada)}
                      <br />
                      <small style={{ color: '#666' }}>
                        {new Date(entrada.fecha_entrada).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </td>
                    <td>
                      <strong>{getProductoName(entrada.producto_id)}</strong>
                      {producto && (
                        <>
                          <br />
                          <small style={{ color: '#666' }}>
                            {producto.categoria} • {producto.unidad_medida}
                          </small>
                        </>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      {parseFloat(entrada.cantidad).toFixed(2)}
                      {producto && (
                        <small style={{ display: 'block', color: '#666', fontWeight: 'normal' }}>
                          {producto.unidad_medida}
                        </small>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {formatCurrency(entrada.precio_compra)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#3182ce' }}>
                        {formatCurrency(total)}
                      </strong>
                    </td>
                    <td>
                      {entrada.proveedor ? (
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: '#e6f7ff',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: '#0050b3'
                        }}>
                          {entrada.proveedor}
                        </span>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td>
                      {entrada.nota ? (
                        <div style={{ 
                          maxWidth: '150px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={entrada.nota}>
                          {entrada.nota}
                        </div>
                      ) : (
                        <span style={{ color: '#999' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEdit(entrada)}
                          style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(entrada.id)}
                          style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filteredEntradas.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                  <td colSpan="3" style={{ textAlign: 'right', padding: '12px' }}>
                    TOTALES:
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                    {cantidadTotal.toFixed(2)}
                  </td>
                  <td></td>
                  <td style={{ textAlign: 'right', padding: '12px', color: '#3182ce' }}>
                    {formatCurrency(valorTotal)}
                  </td>
                  <td colSpan="3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        
        {filteredEntradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📦</div>
            {searchTerm || dateFilter || proveedorFilter 
              ? 'No se encontraron entradas con los filtros aplicados' 
              : 'No hay entradas registradas'}
          </div>
        )}
      </div>

      {/* Resumen por proveedor */}
      {proveedoresUnicos.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>👥 Resumen por Proveedor</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
            {proveedoresUnicos.map(proveedor => {
              const entradasProveedor = entradasPorProveedor[proveedor] || [];
              const totalProveedor = sumarPropiedad(entradasProveedor.map(e => ({
                total: parseFloat(e.cantidad) * parseFloat(e.precio_compra)
              })), 'total');
              
              return (
                <div 
                  key={proveedor}
                  style={{
                    padding: '15px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>{proveedor}</h4>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                    <strong>Entradas:</strong> {entradasProveedor.length}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>
                    <strong>Total invertido:</strong> <span style={{ color: '#3182ce' }}>{formatCurrency(totalProveedor)}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
              {editingEntrada ? '✏️ Editar Entrada' : '➕ Nueva Entrada'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Producto *</label>
                <select
                  className="form-input"
                  value={formData.producto_id}
                  onChange={(e) => {
                    const productoId = e.target.value;
                    const producto = productos.find(p => p.id === parseInt(productoId));
                    setFormData({
                      ...formData, 
                      producto_id: productoId,
                      // Pre-llenar precio de compra si existe
                      precio_compra: formData.precio_compra || (producto?.precio_compra || '')
                    });
                  }}
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {Array.isArray(productos) ? productos.filter(p => p.activo).map(producto => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - {producto.categoria} ({producto.unidad_medida})
                    </option>
                  )) : []}
                </select>
              </div>

              {formData.producto_id && (
                <div className="alert alert-success" style={{ marginBottom: '15px', padding: '10px' }}>
                  {(() => {
                    const producto = productos.find(p => p.id === parseInt(formData.producto_id));
                    return producto ? (
                      <>
                        <strong>{producto.nombre}</strong>
                        <br />
                        <small>Stock actual: {producto.stock_actual} {producto.unidad_medida}</small>
                        {producto.precio_compra && (
                          <>
                            <br />
                            <small>Último precio de compra: {formatCurrency(producto.precio_compra)}</small>
                          </>
                        )}
                      </>
                    ) : null;
                  })()}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label className="form-label">Cantidad *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
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
                    min="0.01"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formData.cantidad && formData.precio_compra && (
                <div className="alert alert-success" style={{ marginBottom: '15px' }}>
                  <strong>Total de la entrada: {formatCurrency(calcularSubtotal(formData.precio_compra, formData.cantidad))}</strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Proveedor</label>
                {proveedores.length > 0 ? (
                  <select
                    className="form-input"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                  >
                    <option value="">Seleccionar proveedor (opcional)</option>
                    {proveedores.filter(p => p.activo !== false).map(proveedor => (
                      <option key={proveedor.id} value={proveedor.nombre}>
                        {proveedor.nombre}
                      </option>
                    ))}
                    <option value="__manual__">➕ Ingresar manualmente</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                    placeholder="Nombre del proveedor (opcional)"
                  />
                )}
              </div>

              {formData.proveedor === '__manual__' && (
                <div className="form-group">
                  <label className="form-label">Nombre del Proveedor</label>
                  <input
                    type="text"
                    className="form-input"
                    value={''}
                    onChange={(e) => setFormData({...formData, proveedor: e.target.value})}
                    placeholder="Ingrese el nombre del proveedor"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nota</label>
                <textarea
                  className="form-input"
                  value={formData.nota}
                  onChange={(e) => setFormData({...formData, nota: e.target.value})}
                  placeholder="Notas adicionales sobre esta entrada..."
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
                  {editingEntrada ? 'Actualizar' : 'Registrar'} Entrada
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