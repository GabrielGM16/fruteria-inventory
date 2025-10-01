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
  
  // Estados para el modal de cantidad
  const [showCantidadModal, setShowCantidadModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadIngresada, setCantidadIngresada] = useState('');

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
      
      // Ensure data is an array before using array methods
      const productosData = Array.isArray(productosResponse.data.data) ? productosResponse.data.data : [];
      const ventasData = Array.isArray(ventasResponse.data.data) ? ventasResponse.data.data : [];
      
      setProductos(productosData.filter(p => p.activo && p.stock_actual > 0));
      setVentas(ventasData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error al cargar datos');
      // Set default empty arrays on error
      setProductos([]);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCantidad = (producto) => {
    setProductoSeleccionado(producto);
    setCantidadIngresada('');
    setShowCantidadModal(true);
  };

  const cerrarModalCantidad = () => {
    setShowCantidadModal(false);
    setProductoSeleccionado(null);
    setCantidadIngresada('');
  };

  const calcularPrecioTotal = () => {
    if (!productoSeleccionado || !cantidadIngresada) return 0;
    return parseFloat(cantidadIngresada) * parseFloat(productoSeleccionado.precio_venta);
  };

  const confirmarAgregarAlCarrito = () => {
    if (!productoSeleccionado || !cantidadIngresada || parseFloat(cantidadIngresada) <= 0) {
      alert('Por favor ingrese una cantidad válida');
      return;
    }

    const cantidad = parseFloat(cantidadIngresada);
    
    if (cantidad > productoSeleccionado.stock_actual) {
      alert(`No hay suficiente stock disponible. Stock actual: ${productoSeleccionado.stock_actual} ${productoSeleccionado.unidad_medida}`);
      return;
    }

    const existingItem = carrito.find(item => item.id === productoSeleccionado.id);
    
    if (existingItem) {
      const nuevaCantidad = existingItem.cantidad + cantidad;
      if (nuevaCantidad > productoSeleccionado.stock_actual) {
        alert(`No hay suficiente stock disponible. Ya tiene ${existingItem.cantidad} ${productoSeleccionado.unidad_medida} en el carrito.`);
        return;
      }
      
      setCarrito(carrito.map(item =>
        item.id === productoSeleccionado.id
          ? { ...item, cantidad: nuevaCantidad }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        id: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        precio: parseFloat(productoSeleccionado.precio_venta),
        cantidad: cantidad,
        stock_disponible: productoSeleccionado.stock_actual,
        unidad_medida: productoSeleccionado.unidad_medida
      }]);
    }

    cerrarModalCantidad();
  };

  const agregarAlCarrito = (producto) => {
    abrirModalCantidad(producto);
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

      {/* Modal para ingresar cantidad */}
      {showCantidadModal && productoSeleccionado && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2d3748' }}>
              Agregar al Carrito
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>
                {productoSeleccionado.nombre}
              </h4>
              <p style={{ margin: '0 0 5px 0', color: '#718096' }}>
                Categoría: {productoSeleccionado.categoria}
              </p>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#3182ce' }}>
                Precio: ${parseFloat(productoSeleccionado.precio_venta).toFixed(2)} / {productoSeleccionado.unidad_medida}
              </p>
              <p style={{ margin: 0, color: '#718096' }}>
                Stock disponible: {productoSeleccionado.stock_actual} {productoSeleccionado.unidad_medida}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#4a5568'
              }}>
                Cantidad ({productoSeleccionado.unidad_medida}):
              </label>
              <input
                type="number"
                value={cantidadIngresada}
                onChange={(e) => setCantidadIngresada(e.target.value)}
                placeholder={`Ingrese cantidad en ${productoSeleccionado.unidad_medida}`}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                min="0"
                step="0.01"
                max={productoSeleccionado.stock_actual}
              />
            </div>

            {cantidadIngresada && parseFloat(cantidadIngresada) > 0 && (
              <div style={{
                backgroundColor: '#f7fafc',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Cantidad:</span>
                  <span>{cantidadIngresada} {productoSeleccionado.unidad_medida}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Precio por {productoSeleccionado.unidad_medida}:</span>
                  <span>${parseFloat(productoSeleccionado.precio_venta).toFixed(2)}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontWeight: 'bold',
                  fontSize: '18px',
                  color: '#3182ce',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '8px'
                }}>
                  <span>Total a pagar:</span>
                  <span>${calcularPrecioTotal().toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={cerrarModalCantidad}
                style={{
                  padding: '12px 20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: '#4a5568',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAgregarAlCarrito}
                disabled={!cantidadIngresada || parseFloat(cantidadIngresada) <= 0}
                style={{
                  padding: '12px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: cantidadIngresada && parseFloat(cantidadIngresada) > 0 ? '#3182ce' : '#a0aec0',
                  color: 'white',
                  cursor: cantidadIngresada && parseFloat(cantidadIngresada) > 0 ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                🛒 Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;