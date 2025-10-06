// src/components/Ventas.js
import React, { useState, useEffect } from 'react';
import { ventasService, productosService } from '../services/api';
import { useToast } from './Toast';
import BarcodeScanner from './BarcodeScanner';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { 
  calcularTotalCarrito, 
  calcularSubtotal, 
  validarStock,
  generarFolio
} from '../utils/helpers';
import { printTicket, previewTicket } from '../services/print';

const Ventas = () => {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [clienteInfo, setClienteInfo] = useState({
    nombre: '',
    telefono: '',
    email: ''
  });
  const toast = useToast();
  
  // Estados para el modal de cantidad
  const [showCantidadModal, setShowCantidadModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidadIngresada, setCantidadIngresada] = useState('');

  // Estados para filtros de historial
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [productosResponse, ventasResponse] = await Promise.all([
        productosService.getAll(),
        ventasService.getAll()
      ]);
      
      const productosData = Array.isArray(productosResponse.data.data) ? productosResponse.data.data : [];
      const ventasData = Array.isArray(ventasResponse.data.data) ? ventasResponse.data.data : [];
      
      setProductos(productosData.filter(p => p.activo && p.stock_actual > 0));
      setVentas(ventasData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
      setProductos([]);
      setVentas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      toast.warning('Por favor ingrese una cantidad válida');
      return;
    }

    const cantidad = parseFloat(cantidadIngresada);
    
    if (!validarStock(productoSeleccionado, cantidad)) {
      toast.error(`Stock insuficiente. Disponible: ${productoSeleccionado.stock_actual} ${productoSeleccionado.unidad_medida}`);
      return;
    }

    const existingItem = carrito.find(item => item.id === productoSeleccionado.id);
    
    if (existingItem) {
      const nuevaCantidad = existingItem.cantidad + cantidad;
      if (!validarStock(productoSeleccionado, nuevaCantidad)) {
        toast.error(`Stock insuficiente. Ya tiene ${existingItem.cantidad} en el carrito`);
        return;
      }
      
      setCarrito(carrito.map(item =>
        item.id === productoSeleccionado.id
          ? { ...item, cantidad: nuevaCantidad }
          : item
      ));
      toast.success(`✅ Cantidad actualizada: ${productoSeleccionado.nombre}`);
    } else {
      setCarrito([...carrito, {
        id: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        precio: parseFloat(productoSeleccionado.precio_venta),
        cantidad: cantidad,
        stock_disponible: productoSeleccionado.stock_actual,
        unidad_medida: productoSeleccionado.unidad_medida
      }]);
      toast.success(`✅ Producto agregado: ${productoSeleccionado.nombre}`);
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
    if (!validarStock(producto, nuevaCantidad)) {
      toast.error('Stock insuficiente');
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
    toast.info('Producto eliminado del carrito');
  };

  const calcularTotal = () => {
    return calcularTotalCarrito(carrito);
  };

  const handleBarcodeScanned = (code) => {
    console.log('Código escaneado:', code);
    // Buscar producto por código
    const producto = productos.find(p => 
      p.sku === code || 
      p.codigo_barras === code ||
      p.id.toString() === code
    );
    
    if (producto) {
      agregarAlCarrito(producto);
      setShowScanner(false);
      toast.success(`Producto encontrado: ${producto.nombre}`);
    } else {
      toast.error('Producto no encontrado');
    }
  };

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      toast.warning('El carrito está vacío');
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
          subtotal: calcularSubtotal(item.precio, item.cantidad)
        }))
      };

      const response = await ventasService.create(ventaData);
      
      // Preparar datos para el ticket
      const ventaCompleta = {
        id: response.data?.id || generarFolio('VEN'),
        fecha_venta: new Date(),
        cliente_nombre: ventaData.cliente_nombre,
        cliente_telefono: ventaData.cliente_telefono,
        metodo_pago: ventaData.metodo_pago,
        total: ventaData.total
      };

      const detallesTicket = carrito.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio_unitario: item.precio,
        subtotal: calcularSubtotal(item.precio, item.cantidad)
      }));

      // Imprimir ticket automáticamente
      printTicket(ventaCompleta, detallesTicket);
      
      toast.success('✅ Venta procesada y ticket impreso');
      
      // Limpiar carrito y formulario
      setCarrito([]);
      setClienteInfo({ nombre: '', telefono: '', email: '' });
      setMetodoPago('efectivo');
      
      // Recargar datos
      loadData();
      
    } catch (error) {
      console.error('Error processing sale:', error);
      toast.error('Error al procesar la venta');
    }
  };

  const verVistaPrevia = () => {
    if (carrito.length === 0) {
      toast.warning('El carrito está vacío');
      return;
    }

    const ventaData = {
      id: 'PREVIEW',
      fecha_venta: new Date(),
      cliente_nombre: clienteInfo.nombre || 'Cliente General',
      cliente_telefono: clienteInfo.telefono,
      metodo_pago: metodoPago,
      total: calcularTotal()
    };
    
    const detallesTicket = carrito.map(item => ({
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: calcularSubtotal(item.precio, item.cantidad)
    }));

    previewTicket(ventaData, detallesTicket);
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ventasFiltradas = ventas.filter(venta => {
    const matchFecha = !filtroFecha || venta.fecha_venta.startsWith(filtroFecha);
    const matchMetodo = !filtroMetodoPago || venta.metodo_pago === filtroMetodoPago;
    return matchFecha && matchMetodo;
  });

  // Calcular estadísticas del historial
  const totalVentas = ventasFiltradas.length;
  const ingresoTotal = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
  const ticketPromedio = totalVentas > 0 ? ingresoTotal / totalVentas : 0;

  if (loading) {
    return <div className="loading">Cargando punto de venta...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title">💰 Punto de Venta</h1>
            <p className="page-subtitle">Sistema de ventas y facturación</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowScanner(true)}
              style={{ padding: '10px 20px' }}
            >
              🏷️ Escanear Código
            </button>
            <button
              className="btn"
              onClick={() => setShowHistorial(!showHistorial)}
              style={{ 
                backgroundColor: showHistorial ? '#3182ce' : '#e2e8f0', 
                color: showHistorial ? 'white' : '#4a5568',
                padding: '10px 20px'
              }}
            >
              {showHistorial ? '🛒 Volver a Ventas' : '📊 Ver Historial'}
            </button>
          </div>
        </div>
      </div>

      {!showHistorial ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          {/* Panel de productos */}
          <div>
            <div className="card">
              <input
                type="text"
                placeholder="🔍 Buscar productos..."
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
                      e.currentTarget.style.borderColor = '#3182ce';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>{producto.nombre}</h4>
                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9rem' }}>
                      {producto.categoria}
                    </p>
                    <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#3182ce' }}>
                      {formatCurrency(producto.precio_venta)} / {producto.unidad_medida}
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
              <h3 style={{ marginTop: 0 }}>🛒 Carrito de Compras</h3>
              
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
                          <small>{formatCurrency(item.precio)} / {item.unidad_medida}</small>
                          <br />
                          <small style={{ color: '#3182ce', fontWeight: 'bold' }}>
                            Subtotal: {formatCurrency(calcularSubtotal(item.precio, item.cantidad))}
                          </small>
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
                    <h4>👤 Información del Cliente</h4>
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Nombre del cliente (opcional)"
                        value={clienteInfo.nombre}
                        onChange={(e) => setClienteInfo({...clienteInfo, nombre: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="tel"
                        placeholder="Teléfono (opcional)"
                        value={clienteInfo.telefono}
                        onChange={(e) => setClienteInfo({...clienteInfo, telefono: e.target.value})}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Método de pago */}
                  <div className="form-group">
                    <label className="form-label">💳 Método de Pago</label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="form-input"
                    >
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="transferencia">🏦 Transferencia</option>
                    </select>
                  </div>

                  {/* Total */}
                  <div style={{ 
                    borderTop: '2px solid #3182ce', 
                    paddingTop: '15px', 
                    marginTop: '20px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '1.2rem' }}>Total:</strong>
                      <strong style={{ fontSize: '1.5rem', color: '#3182ce' }}>
                        {formatCurrency(calcularTotal())}
                      </strong>
                    </div>
                    <small style={{ color: '#666', display: 'block', textAlign: 'right' }}>
                      {carrito.length} producto{carrito.length !== 1 ? 's' : ''}
                    </small>
                  </div>

                  {/* Botones de acción */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button
                      onClick={verVistaPrevia}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '12px' }}
                    >
                      👁️ Vista Previa
                    </button>
                    <button
                      onClick={procesarVenta}
                      className="btn btn-success"
                      style={{ flex: 2, padding: '12px' }}
                    >
                      💳 Procesar Venta
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Historial de ventas */
        <div>
          {/* Estadísticas del historial */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Ventas</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{totalVentas}</div>
            </div>
            
            <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Ingresos Total</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{formatCurrency(ingresoTotal)}</div>
            </div>
            
            <div className="card" style={{ padding: '15px', background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', color: 'white' }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Ticket Promedio</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '5px 0' }}>{formatCurrency(ticketPromedio)}</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Fecha:</label>
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="form-input"
                />
              </div>
              
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Método de Pago:</label>
                <select
                  value={filtroMetodoPago}
                  onChange={(e) => setFiltroMetodoPago(e.target.value)}
                  className="form-input"
                >
                  <option value="">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              {(filtroFecha || filtroMetodoPago) && (
                <button
                  onClick={() => {
                    setFiltroFecha('');
                    setFiltroMetodoPago('');
                  }}
                  className="btn"
                  style={{ backgroundColor: '#e2e8f0', color: '#4a5568', marginTop: '20px' }}
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Tabla de historial */}
          <div className="card">
            <h3>📋 Historial de Ventas</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Método Pago</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map((venta) => (
                    <tr key={venta.id}>
                      <td><strong>#{venta.id}</strong></td>
                      <td>{formatDateTime(venta.fecha_venta)}</td>
                      <td>{venta.cliente_nombre || 'Cliente General'}</td>
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
                          {venta.metodo_pago === 'efectivo' ? '💵' : venta.metodo_pago === 'tarjeta' ? '💳' : '🏦'} {venta.metodo_pago}
                        </span>
                      </td>
                      <td><strong>{formatCurrency(venta.total)}</strong></td>
                      <td>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem',
                          backgroundColor: '#c6f6d5',
                          color: '#276749'
                        }}>
                          ✅ Completada
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            // Reimprimir ticket
                            const detalles = []; // Aquí deberías obtener los detalles de la venta
                            printTicket(venta, detalles);
                            toast.info('Reimprimiendo ticket...');
                          }}
                          style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                        >
                          🖨️ Imprimir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {ventasFiltradas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                {filtroFecha || filtroMetodoPago ? 'No se encontraron ventas con los filtros aplicados' : 'No hay ventas registradas'}
              </div>
            )}
          </div>
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
              🛒 Agregar al Carrito
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#4a5568' }}>
                {productoSeleccionado.nombre}
              </h4>
              <p style={{ margin: '0 0 5px 0', color: '#718096' }}>
                Categoría: {productoSeleccionado.categoria}
              </p>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#3182ce' }}>
                Precio: {formatCurrency(productoSeleccionado.precio_venta)} / {productoSeleccionado.unidad_medida}
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
                autoFocus
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
                  <span>{formatCurrency(productoSeleccionado.precio_venta)}</span>
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
                  <span>{formatCurrency(calcularPrecioTotal())}</span>
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

      {/* Scanner de código de barras */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default Ventas;