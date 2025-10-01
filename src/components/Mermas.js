import React, { useState, useEffect } from 'react';
import { productosService } from '../services/api';

const Mermas = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('auditoria'); // auditoria, analisis, historial
  const [showModal, setShowModal] = useState(false);
  
  // Estado para auditoría
  const [conteoFisico, setConteoFisico] = useState({});
  const [diferencias, setDiferencias] = useState([]);
  
  // Estado para análisis financiero
  const [analisisFinanciero, setAnalisisFinanciero] = useState({
    ventasEsperadas: 0,
    efectivoCaja: 0,
    diferencia: 0
  });
  
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    motivo: '',
    descripcion: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const productosRes = await productosService.getAll();
      const productosData = Array.isArray(productosRes.data) ? productosRes.data : [];
      setProductos(productosData);
      
      // Inicializar conteo físico con cantidades del sistema
      const conteoInicial = {};
      productosData.forEach(p => {
        conteoInicial[p.id] = p.stock || 0;
      });
      setConteoFisico(conteoInicial);
    } catch (error) {
      console.error('Error loading data:', error);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConteoChange = (productoId, valor) => {
    setConteoFisico({
      ...conteoFisico,
      [productoId]: parseFloat(valor) || 0
    });
  };

  const calcularDiferencias = () => {
    const difs = productos.map(producto => {
      const stockSistema = producto.stock || 0;
      const stockFisico = conteoFisico[producto.id] || 0;
      const diferencia = stockFisico - stockSistema;
      const valorDiferencia = diferencia * (producto.precio_venta || 0);
      
      return {
        id: producto.id,
        nombre: producto.nombre,
        stockSistema,
        stockFisico,
        diferencia,
        valorDiferencia,
        precioVenta: producto.precio_venta || 0
      };
    }).filter(d => d.diferencia !== 0);
    
    setDiferencias(difs);
  };

  const calcularAnalisisFinanciero = () => {
    // Calcular ventas esperadas basadas en inventario vendido
    let ventasEsperadas = 0;
    
    productos.forEach(producto => {
      const stockActual = producto.stock || 0;
      const stockInicial = producto.stock_inicial || 0; // Necesitarías guardar esto
      const compras = producto.compras_periodo || 0; // Necesitarías calcularlo
      
      // Fórmula: Stock Inicial + Compras - Stock Final = Vendido
      const unidadesVendidas = stockInicial + compras - stockActual;
      const ingresoEsperado = unidadesVendidas * (producto.precio_venta || 0);
      
      ventasEsperadas += ingresoEsperado;
    });
    
    // Aquí deberías obtener el efectivo real en caja desde tu sistema
    const efectivoCaja = analisisFinanciero.efectivoCaja || 0;
    
    setAnalisisFinanciero({
      ventasEsperadas: ventasEsperadas,
      efectivoCaja: efectivoCaja,
      diferencia: efectivoCaja - ventasEsperadas
    });
  };

  const registrarMerma = async (e) => {
    e.preventDefault();
    try {
      // Implementar llamada al API
      // await mermasService.create(formData);
      alert('Merma registrada exitosamente');
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error registering merma:', error);
      alert('Error al registrar merma');
    }
  };

  const registrarMermaDesdeAuditoria = (diferencia) => {
    if (diferencia.diferencia < 0) {
      setFormData({
        producto_id: diferencia.id,
        cantidad: Math.abs(diferencia.diferencia).toString(),
        motivo: 'otro',
        descripcion: `Diferencia detectada en auditoría: ${diferencia.diferencia} unidades`
      });
      setShowModal(true);
    }
  };

  const resetForm = () => {
    setFormData({
      producto_id: '',
      cantidad: '',
      motivo: '',
      descripcion: ''
    });
  };

  if (loading) {
    return <div className="loading">Cargando datos...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">🔍 Control de Mermas y Auditoría</h1>
        <p className="page-subtitle">Reconciliación de inventario y análisis financiero</p>
      </div>

      {/* Tabs de navegación */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('auditoria')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'auditoria' ? '#3b82f6' : 'transparent',
            color: activeTab === 'auditoria' ? 'white' : '#4a5568',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: activeTab === 'auditoria' ? 'bold' : 'normal'
          }}
        >
          📦 Auditoría de Inventario
        </button>
        <button
          onClick={() => setActiveTab('analisis')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'analisis' ? '#3b82f6' : 'transparent',
            color: activeTab === 'analisis' ? 'white' : '#4a5568',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: activeTab === 'analisis' ? 'bold' : 'normal'
          }}
        >
          💰 Análisis Financiero
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: activeTab === 'historial' ? '#3b82f6' : 'transparent',
            color: activeTab === 'historial' ? 'white' : '#4a5568',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: activeTab === 'historial' ? 'bold' : 'normal'
          }}
        >
          📋 Historial de Mermas
        </button>
      </div>

      {/* SECCIÓN: AUDITORÍA DE INVENTARIO */}
      {activeTab === 'auditoria' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>📋 Conteo Físico de Inventario</h3>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              Ingresa las cantidades físicas reales. El sistema comparará con el inventario registrado.
            </p>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Producto</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Stock Sistema</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Stock Físico</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Diferencia</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map(producto => {
                    const stockSistema = producto.stock || 0;
                    const stockFisico = conteoFisico[producto.id] || 0;
                    const diferencia = stockFisico - stockSistema;
                    
                    return (
                      <tr key={producto.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px' }}>{producto.nombre}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <strong>{stockSistema.toFixed(2)}</strong>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={stockFisico}
                            onChange={(e) => handleConteoChange(producto.id, e.target.value)}
                            style={{
                              width: '80px',
                              padding: '5px',
                              border: '1px solid #cbd5e0',
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}
                          />
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          color: diferencia < 0 ? '#ef4444' : diferencia > 0 ? '#10b981' : '#666',
                          fontWeight: 'bold'
                        }}>
                          {diferencia !== 0 && (diferencia > 0 ? '+' : '')}{diferencia.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          ${(producto.precio_venta || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={calcularDiferencias}
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
            >
              🔍 Calcular Diferencias
            </button>
          </div>

          {/* Resumen de diferencias */}
          {diferencias.length > 0 && (
            <div className="card">
              <h3>⚠️ Diferencias Detectadas</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fee2e2', borderBottom: '2px solid #fecaca' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Producto</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Sistema</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Físico</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Diferencia</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diferencias.map(dif => (
                      <tr key={dif.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px' }}>{dif.nombre}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{dif.stockSistema.toFixed(2)}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{dif.stockFisico.toFixed(2)}</td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          color: dif.diferencia < 0 ? '#ef4444' : '#10b981',
                          fontWeight: 'bold'
                        }}>
                          {dif.diferencia > 0 ? '+' : ''}{dif.diferencia.toFixed(2)}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'right',
                          color: dif.valorDiferencia < 0 ? '#ef4444' : '#10b981',
                          fontWeight: 'bold'
                        }}>
                          ${dif.valorDiferencia.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {dif.diferencia < 0 && (
                            <button
                              onClick={() => registrarMermaDesdeAuditoria(dif)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Registrar Merma
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                      <td colSpan="4" style={{ padding: '12px', textAlign: 'right' }}>
                        Total Diferencia:
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'right',
                        color: diferencias.reduce((sum, d) => sum + d.valorDiferencia, 0) < 0 ? '#ef4444' : '#10b981',
                        fontSize: '16px'
                      }}>
                        ${diferencias.reduce((sum, d) => sum + d.valorDiferencia, 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN: ANÁLISIS FINANCIERO */}
      {activeTab === 'analisis' && (
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3>💰 Configuración del Análisis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Efectivo en Caja (Real):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={analisisFinanciero.efectivoCaja}
                  onChange={(e) => setAnalisisFinanciero({
                    ...analisisFinanciero,
                    efectivoCaja: parseFloat(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #cbd5e0',
                    borderRadius: '4px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={calcularAnalisisFinanciero}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  📊 Calcular Análisis
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div className="card" style={{ backgroundColor: '#dbeafe' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>💵 Ventas Esperadas</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0', color: '#1e40af' }}>
                ${analisisFinanciero.ventasEsperadas.toFixed(2)}
              </p>
              <small style={{ color: '#64748b' }}>Basado en inventario vendido</small>
            </div>

            <div className="card" style={{ backgroundColor: '#d1fae5' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#065f46' }}>💰 Efectivo en Caja</h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '10px 0', color: '#065f46' }}>
                ${analisisFinanciero.efectivoCaja.toFixed(2)}
              </p>
              <small style={{ color: '#64748b' }}>Efectivo real disponible</small>
            </div>

            <div className="card" style={{ 
              backgroundColor: analisisFinanciero.diferencia < 0 ? '#fee2e2' : '#d1fae5' 
            }}>
              <h4 style={{ 
                margin: '0 0 10px 0', 
                color: analisisFinanciero.diferencia < 0 ? '#991b1b' : '#065f46' 
              }}>
                📉 Diferencia
              </h4>
              <p style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                margin: '10px 0',
                color: analisisFinanciero.diferencia < 0 ? '#991b1b' : '#065f46'
              }}>
                ${analisisFinanciero.diferencia.toFixed(2)}
              </p>
              <small style={{ color: '#64748b' }}>
                {analisisFinanciero.diferencia < 0 ? 'Faltante' : 'Excedente'}
              </small>
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <h3>📝 Interpretación</h3>
            <div style={{ padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              {analisisFinanciero.diferencia < -100 && (
                <p style={{ color: '#991b1b', fontWeight: 'bold' }}>
                  ⚠️ <strong>Alerta:</strong> Hay un faltante significativo de ${Math.abs(analisisFinanciero.diferencia).toFixed(2)}. 
                  Revisa posibles mermas no registradas, ventas sin registrar, o descuadres de caja.
                </p>
              )}
              {analisisFinanciero.diferencia >= -100 && analisisFinanciero.diferencia < 0 && (
                <p style={{ color: '#f59e0b' }}>
                  ℹ️ Hay un faltante menor de ${Math.abs(analisisFinanciero.diferencia).toFixed(2)}. 
                  Considera revisar el registro de gastos operativos.
                </p>
              )}
              {analisisFinanciero.diferencia >= 0 && analisisFinanciero.diferencia < 100 && (
                <p style={{ color: '#10b981' }}>
                  ✅ La caja está balanceada. Excelente control financiero.
                </p>
              )}
              {analisisFinanciero.diferencia >= 100 && (
                <p style={{ color: '#3b82f6' }}>
                  💡 Hay un excedente de ${analisisFinanciero.diferencia.toFixed(2)}. 
                  Verifica que todas las ventas estén registradas correctamente.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN: HISTORIAL DE MERMAS */}
      {activeTab === 'historial' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>📋 Historial de Mermas</h3>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              ➕ Registrar Merma
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            🚧 Funcionalidad próximamente disponible
            <br />
            <small>Aquí se mostrarán todas las mermas registradas</small>
          </div>
        </div>
      )}

      {/* Modal para registrar merma */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Registrar Nueva Merma</h3>
            <form onSubmit={registrarMerma}>
              <div className="form-group">
                <label>Producto:</label>
                <select
                  value={formData.producto_id}
                  onChange={(e) => setFormData({...formData, producto_id: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map(producto => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} (Stock: {producto.stock})
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
                  <option value="vencido">Vencimiento</option>
                  <option value="dañado">Daño físico</option>
                  <option value="robo">Robo/Pérdida</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="form-input"
                  rows="3"
                  placeholder="Detalles adicionales..."
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