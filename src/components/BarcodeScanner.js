// src/components/BarcodeScanner.js
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [scanMode, setScanMode] = useState('manual'); // 'manual' o 'camera'
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const toast = useToast();

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setScanning(true);

      // Solicitar acceso a la cámara
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Cámara trasera en móviles
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      toast.info('Cámara activada. Apunta al código de barras');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Usa el modo manual.');
      toast.error('Error al acceder a la cámara');
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      toast.success(`Código escaneado: ${manualCode}`);
    }
  };

  const handleKeyPress = (e) => {
    // Detectar entrada rápida de escáner USB (simula escritura rápida)
    if (e.key === 'Enter' && manualCode.trim()) {
      handleManualSubmit(e);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginTop: 0, textAlign: 'center' }}>
          🏷️ Escanear Código de Barras
        </h3>

        {/* Selector de modo */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '10px'
        }}>
          <button
            onClick={() => {
              setScanMode('manual');
              stopCamera();
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: scanMode === 'manual' ? '#667eea' : '#e2e8f0',
              color: scanMode === 'manual' ? 'white' : '#4a5568',
              cursor: 'pointer',
              fontWeight: scanMode === 'manual' ? 'bold' : 'normal'
            }}
          >
            ⌨️ Manual
          </button>
          <button
            onClick={() => {
              setScanMode('camera');
              if (!scanning) startCamera();
            }}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: scanMode === 'camera' ? '#667eea' : '#e2e8f0',
              color: scanMode === 'camera' ? 'white' : '#4a5568',
              cursor: 'pointer',
              fontWeight: scanMode === 'camera' ? 'bold' : 'normal'
            }}
          >
            📷 Cámara
          </button>
        </div>

        {/* Modo Manual */}
        {scanMode === 'manual' && (
          <div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f7fafc',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0 0 10px 0', color: '#4a5568' }}>
                💡 <strong>Tres formas de ingresar el código:</strong>
              </p>
              <ol style={{ textAlign: 'left', color: '#718096', fontSize: '0.9rem' }}>
                <li>Escribe el código manualmente</li>
                <li>Usa un escáner USB conectado</li>
                <li>Copia y pega el código</li>
              </ol>
            </div>

            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label">Código de Barras:</label>
                <input
                  type="text"
                  className="form-input"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ingresa o escanea el código..."
                  autoFocus
                  style={{
                    fontSize: '1.2rem',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    padding: '15px'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!manualCode.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  opacity: manualCode.trim() ? 1 : 0.5
                }}
              >
                ✅ Buscar Producto
              </button>
            </form>
          </div>
        )}

        {/* Modo Cámara */}
        {scanMode === 'camera' && (
          <div>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '15px' }}>
                {error}
              </div>
            )}

            {!scanning && !error && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📷</div>
                <button
                  onClick={startCamera}
                  className="btn btn-primary"
                  style={{ padding: '12px 30px' }}
                >
                  🎥 Activar Cámara
                </button>
              </div>
            )}

            {scanning && (
              <div>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  backgroundColor: '#000',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '15px'
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                  
                  {/* Guía de escaneo */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    height: '100px',
                    border: '2px solid #48bb78',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-30px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#48bb78',
                      color: 'white',
                      padding: '5px 15px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap'
                    }}>
                      Alinea el código aquí
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '15px',
                  backgroundColor: '#fef5e7',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: '#92400e', fontSize: '0.9rem' }}>
                    ⚠️ <strong>Nota:</strong> La lectura automática con cámara requiere
                    una librería adicional. Por ahora, usa el modo manual o un escáner USB.
                  </p>
                </div>

                <button
                  onClick={stopCamera}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '10px' }}
                >
                  ⏹️ Detener Cámara
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botón cerrar */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="btn"
          style={{
            width: '100%',
            marginTop: '15px',
            backgroundColor: '#e2e8f0',
            color: '#4a5568',
            padding: '10px'
          }}
        >
          ✕ Cerrar
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;