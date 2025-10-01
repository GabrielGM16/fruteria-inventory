import React, { useState } from 'react';

const PagoTarjeta = () => {
  const [formData, setFormData] = useState({
    numeroTarjeta: '',
    nombreTitular: '',
    fechaVencimiento: '',
    cvv: '',
    monto: ''
  });
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Pago procesado exitosamente');
      resetForm();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      numeroTarjeta: '',
      nombreTitular: '',
      fechaVencimiento: '',
      cvv: '',
      monto: ''
    });
  };

  const formatCardNumber = (value) => {
    // Remover espacios y caracteres no numéricos
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Agregar espacios cada 4 dígitos
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Pago con Tarjeta</h1>
        <p className="page-subtitle">Procesamiento de pagos electrónicos</p>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, textAlign: 'center', color: '#4a5568' }}>
            💳 Información de Pago
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Número de Tarjeta:</label>
              <input
                type="text"
                value={formData.numeroTarjeta}
                onChange={(e) => setFormData({
                  ...formData, 
                  numeroTarjeta: formatCardNumber(e.target.value)
                })}
                className="form-input"
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                required
              />
            </div>

            <div className="form-group">
              <label>Nombre del Titular:</label>
              <input
                type="text"
                value={formData.nombreTitular}
                onChange={(e) => setFormData({...formData, nombreTitular: e.target.value.toUpperCase()})}
                className="form-input"
                placeholder="NOMBRE COMPLETO"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Fecha de Vencimiento:</label>
                <input
                  type="text"
                  value={formData.fechaVencimiento}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    setFormData({...formData, fechaVencimiento: value});
                  }}
                  className="form-input"
                  placeholder="MM/AA"
                  maxLength="5"
                  required
                />
              </div>

              <div className="form-group">
                <label>CVV:</label>
                <input
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => setFormData({
                    ...formData, 
                    cvv: e.target.value.replace(/\D/g, '').substring(0, 4)
                  })}
                  className="form-input"
                  placeholder="123"
                  maxLength="4"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Monto a Pagar:</label>
              <input
                type="number"
                step="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({...formData, monto: e.target.value})}
                className="form-input"
                placeholder="0.00"
                required
              />
            </div>

            <div style={{ marginTop: '30px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={processing}
                style={{ 
                  width: '100%', 
                  padding: '15px',
                  fontSize: '1.1rem',
                  opacity: processing ? 0.7 : 1
                }}
              >
                {processing ? '🔄 Procesando...' : '💳 Procesar Pago'}
              </button>
            </div>
          </form>

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#f7fafc', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#4a5568'
          }}>
            <p style={{ margin: '0 0 10px 0' }}>🔒 <strong>Pago Seguro</strong></p>
            <p style={{ margin: 0 }}>
              Esta es una simulación. En un entorno real, los datos de la tarjeta 
              serían procesados a través de un gateway de pago seguro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagoTarjeta;