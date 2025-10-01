import React, { useState, useEffect } from 'react';
import { ventasService, productosService } from '../services/api';

const Ventas = () => {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistorial, setShowHistorial] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [clienteInfo, setClienteInfo] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productosResponse, ventasResponse] = await Promise.all([
        productosService.getAll(),
        ventasService.getAll()
      ]);
      setProductos(productosResponse.data.filter(p => p.activo && p.stock_actual > 0));
      setVentas(ventasResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const agregarAlCarrito = (producto) => {
    const existingItem = carrito.find(item => item.id === producto.id);
    
    if (existingItem) {
      if (existingItem.cantidad < producto.stock_actual) {
        setCarrito(carrito.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ));
      } else {
        alert('No hay suficiente stock disponible');
      }
    } else {
      setCarrito([...carrito, {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio_venta,
        cantidad: 1,
        stock_disponible: producto.stock_actual,
        unidad_medida: producto.unidad_medida
      }]);
    }
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }

    const producto = productos.find(p => p.id === id);
    if (nuevaCantidad > producto.stock_actual) {
      alert('No hay suficiente stock disponible');
      return;
    }

    setCarrito(carrito.map(item =>
      item.id === id
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      const ventaData = {
        cliente_nombre: clienteInfo.nombre || 'Cliente General',
        cliente_telefono: clienteInfo.telefono || null,
        cliente_email: clienteInfo.email || null,
        metodo_pago: metodoPago,
        total: calcularTotal(),
        detalles: carrito.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          precio_unitario: item.precio,
          subtotal: item.precio * item.cantidad
        }))
      };

      await ventasService.create(ventaData);
      
      alert('Venta procesada exitosamente');
      
      // Limpiar carrito y formulario
      setCarrito([]);
      setClienteInfo({ nombre: '', telefono: '', email: '' });
      setMetodoPago('efectivo');
      
      // Recargar datos para actualizar stock
      loadData();
      
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Error al procesar la venta');
    }
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Cargando punto de venta...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Punto de Venta</h1>
        <p className="page-subtitle">Sistema de ventas y facturación</p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <button
          className="btn"
          onClick={() => setShowHistorial(!showHistorial)}
          style={{ backgroundColor: showHistorial ? '#3182ce' : '#e2e8f0', color: showHistorial ? 'white' : '#4a5568' }}
        >
          {showHistorial ? '🛒 Volver a Ventas' : '📊 Ver Historial'}
        </button>
      </div>

      {!showHistorial ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Panel de productos */}
          <div>
            <div className="card">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ marginBottom: '20px' }}
              />
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '15px',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                {filteredProductos.map((producto) => (
                  <div
                    key={producto.id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: 'white'
                    }}
                    onClick={() => agregarAlCarrito(producto)}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#3182ce';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{producto.nombre}</h4>
                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9rem' }}>
                      {producto.categoria}
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#3182ce' }}>
                      ${parseFloat(producto.precio_venta).toFixed(2)} / {producto.unidad_medida}
                    </p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.8rem',
                      color: producto.stock_actual <= producto.stock_minimo ? '#e53e3e' : '#38a169'
                    }}>
                      Stock: {producto.stock_actual} {producto.unidad_medida}
                      {producto.stock_actual <= producto.stock_minimo && ' ⚠️'}
                    </p>
                  </div>
                ))}
              </div>
              
              {filteredProductos.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No se encontraron productos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Panel del carrito */}
          <div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Carrito de Compras</h3>
              
              {carrito.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                  El carrito está vacío
                </p>
              ) : (
                <>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                    {carrito.map((item) => (
                      <div key={item.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <div style={{ flex: 1 }}>
                          <strong>{item.nombre}</strong>
                          <br />
                          <small>${item.precio.toFixed(2)} / {item.unidad_medida}</small>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(item.id, parseFloat(e.target.value))}
                            style={{ width: '60px', padding: '5px', textAlign: 'center' }}
                            min="0"
                            step="0.01"
                          />
                          <button
                            onClick={() => eliminarDelCarrito(item.id)}
                            style={{ 
                              background: '#e53e3e', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px',
                              padding: '5px 8px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Información del cliente */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4>Información del Cliente</h4>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Nombre del cliente"
                        value={clienteInfo.nombre}
                        onChange={(e) => setClienteInfo({...clienteInfo, nombre: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        value={clienteInfo.telefono}
                        onChange={(e) => setClienteInfo({...clienteInfo, telefono: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Método de pago */}
                  <div className="form-group">
                    <label className="form-label">Método de Pago</label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="form-input"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>

                  {/* Total */}
                  <div style={{ 
                    borderTop: '2px solid #3182ce', 
                    paddingTop: '15px', 
                    marginTop: '20px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.2rem' }}>Total:</strong>
                      <strong style={{ fontSize: '1.5rem', color: '#3182ce' }}>
                        ${calcularTotal().toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={procesarVenta}
                    className="btn btn-success"
                    style={{ width: '100%', marginTop: '15px', padding: '12px' }}
                  >
                    💳 Procesar Venta
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Historial de ventas */
        <div className="card">
          <h3>Historial de Ventas</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Método Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id}>
                    <td>{new Date(venta.fecha_venta).toLocaleDateString('es-ES')}</td>
                    <td>{venta.cliente_nombre}</td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        backgroundColor: venta.metodo_pago === 'efectivo' ? '#c6f6d5' : 
                                       venta.metodo_pago === 'tarjeta' ? '#bee3f8' : '#fbb6ce',
                        color: venta.metodo_pago === 'efectivo' ? '#276749' : 
                               venta.metodo_pago === 'tarjeta' ? '#2c5282' : '#97266d'
                      }}>
                        {venta.metodo_pago}
                      </span>
                    </td>
                    <td><strong>${parseFloat(venta.total).toFixed(2)}</strong></td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        backgroundColor: '#c6f6d5',
                        color: '#276749'
                      }}>
                        Completada
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {ventas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No hay ventas registradas
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Ventas;