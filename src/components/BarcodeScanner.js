// src/components/BarcodeScanner.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useToast } from './Toast';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [error, setError] = useState('');
  const [scanMode, setScanMode] = useState('manual'); // 'manual' o 'camera'
  const html5QrcodeScannerRef = useRef(null);
  const barcodeReaderRef = useRef(null);
  const isInitializingRef = useRef(false); // Prevenir inicializaciones múltiples
  const toast = useToast();

  const stopCamera = useCallback(() => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(err => {
        console.log('Error stopping camera:', err);
      });
      html5QrcodeScannerRef.current = null;
    }
    setScanning(false);
    isInitializingRef.current = false;
  }, []);

  const initializeScanner = useCallback(async () => {
    // Prevenir múltiples inicializaciones simultáneas
    if (isInitializingRef.current) {
      console.log('Ya hay una inicialización en progreso...');
      return;
    }

    isInitializingRef.current = true;

    try {
      setError('');
      console.log('Iniciando escáner...');
      
      // Verificar que el elemento existe
      const readerElement = document.getElementById('barcode-reader');
      if (!readerElement) {
        console.error('Elemento barcode-reader no encontrado');
        setError('Error al inicializar el escáner. Recargando...');
        isInitializingRef.current = false;
        return;
      }

      // Limpiar escáner anterior si existe
      if (html5QrcodeScannerRef.current) {
        try {
          await html5QrcodeScannerRef.current.clear();
          html5QrcodeScannerRef.current = null;
        } catch (err) {
          console.log('Error clearing previous scanner:', err);
        }
      }

      // Limpiar el contenido del div antes de crear un nuevo escáner
      readerElement.innerHTML = '';

      // Configuración simplificada del escáner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        rememberLastUsedCamera: true,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
        ],
      };

      console.log('Creando escáner con configuración:', config);

      // Crear instancia del escáner
      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        "barcode-reader",
        config,
        false
      );

      // Callback cuando se escanea exitosamente
      const onScanSuccess = (decodedText, decodedResult) => {
        console.log('✅ Código escaneado:', decodedText);
        toast.success(`Código detectado: ${decodedText}`);
        
        // Detener escáner
        stopCamera();
        
        // Enviar código al componente padre
        onScan(decodedText);
      };

      // Callback para errores
      const onScanError = (errorMessage) => {
        // Solo loguear errores importantes
        if (!errorMessage.includes('NotFoundException') && 
            !errorMessage.includes('No MultiFormat Readers')) {
          console.log('Scan error:', errorMessage);
        }
      };

      // Renderizar escáner
      console.log('Renderizando escáner...');
      html5QrcodeScannerRef.current.render(onScanSuccess, onScanError);
      
      console.log('✅ Escáner iniciado correctamente');
      toast.info('Cámara activada. Apunta al código de barras');
      
    } catch (err) {
      console.error('❌ Error initializing scanner:', err);
      console.error('Error details:', err.message, err.stack);
      setError(`No se pudo iniciar el escáner: ${err.message}. Verifica los permisos de la cámara.`);
      toast.error('Error al iniciar el escáner');
      setScanning(false);
      isInitializingRef.current = false;
    }
  }, [toast, onScan, stopCamera]);

  // Limpiar escáner al desmontar
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Inicializar escáner cuando cambia el modo
  useEffect(() => {
    if (scanMode === 'camera' && scanning) {
      const initWithRetry = (attempt = 1, maxAttempts = 5) => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            const readerElement = barcodeReaderRef.current || document.getElementById('barcode-reader');
            
            if (readerElement && readerElement.offsetParent !== null) {
              console.log('✅ Elemento barcode-reader encontrado y visible, inicializando escáner...');
              initializeScanner();
            } else if (attempt < maxAttempts) {
              console.log(`Elemento barcode-reader no disponible, reintentando... (${attempt}/${maxAttempts})`);
              initWithRetry(attempt + 1, maxAttempts);
            } else {
              console.error('No se pudo encontrar el elemento barcode-reader después de varios intentos');
              setError('Error: No se pudo inicializar el escáner. El elemento DOM no está disponible. Intenta cambiar a modo manual.');
              toast.error('Error al inicializar el escáner - elemento no encontrado');
              isInitializingRef.current = false;
            }
          }, attempt === 1 ? 100 : 300);
        });
      };
      
      initWithRetry();
    } else {
      stopCamera();
    }
  }, [scanMode, scanning]); // Solo depende de scanMode y scanning

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      toast.success(`Código ingresado: ${manualCode}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && manualCode.trim()) {
      handleManualSubmit(e);
    }
  };

  const handleModeChange = (mode) => {
    // Prevenir cambios si ya estamos inicializando
    if (isInitializingRef.current && mode === 'camera') {
      console.log('Inicialización en progreso, espera...');
      return;
    }

    setScanMode(mode);
    if (mode === 'camera') {
      setScanning(true);
    } else {
      stopCamera();
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
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginTop: 0, textAlign: 'center', color: '#1a202c' }}>
          Escanear Código de Barras
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
            onClick={() => handleModeChange('manual')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: scanMode === 'manual' ? '#667eea' : '#e2e8f0',
              color: scanMode === 'manual' ? 'white' : '#4a5568',
              cursor: 'pointer',
              fontWeight: scanMode === 'manual' ? 'bold' : 'normal',
              transition: 'all 0.3s ease'
            }}
          >
            Manual
          </button>
          <button
            onClick={() => handleModeChange('camera')}
            disabled={isInitializingRef.current}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: scanMode === 'camera' ? '#667eea' : '#e2e8f0',
              color: scanMode === 'camera' ? 'white' : '#4a5568',
              cursor: isInitializingRef.current ? 'not-allowed' : 'pointer',
              fontWeight: scanMode === 'camera' ? 'bold' : 'normal',
              transition: 'all 0.3s ease',
              opacity: isInitializingRef.current ? 0.6 : 1
            }}
          >
            Cámara
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
              <p style={{ margin: '0 0 10px 0', color: '#2d3748', fontWeight: 'bold' }}>
                <strong>Tres formas de ingresar el código:</strong>
              </p>
              <ol style={{ textAlign: 'left', color: '#4a5568', fontSize: '0.9rem' }}>
                <li>Escribe el código manualmente</li>
                <li>Usa un escáner USB conectado</li>
                <li>Copia y pega el código</li>
              </ol>
            </div>

            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#2d3748' }}>
                  Código de Barras:
                </label>
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
                    padding: '15px',
                    color: '#1a202c'
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
                Buscar Producto
              </button>
            </form>
          </div>
        )}

        {/* Modo Cámara */}
        {scanMode === 'camera' && (
          <div>
            {error && (
              <div className="alert alert-danger" style={{ marginBottom: '15px' }}>
                <strong>Error:</strong> {error}
                <br />
                <small>
                  <strong>Soluciones:</strong>
                  <ul style={{ marginTop: '10px', marginBottom: 0 }}>
                    <li>Verifica que el navegador tenga permiso para usar la cámara</li>
                    <li>Asegúrate de estar usando Chrome, Edge o Safari</li>
                    <li>Si aparece un icono de cámara bloqueada en la barra de dirección, haz clic para permitir</li>
                    <li>Intenta recargar la página (F5)</li>
                  </ul>
                </small>
              </div>
            )}

            {/* Información de permisos */}
            <div style={{
              padding: '15px',
              backgroundColor: '#e6f7ff',
              borderRadius: '8px',
              marginBottom: '15px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '0 0 10px 0', color: '#2c5282', fontSize: '0.95rem', fontWeight: 'bold' }}>
                <strong>Instrucciones importantes:</strong>
              </p>
              <ol style={{ margin: 0, color: '#2d3748', fontSize: '0.9rem', paddingLeft: '20px' }}>
                <li>El navegador te pedirá permiso para usar la cámara - <strong>debes permitirlo</strong></li>
                <li>Aparecerá un cuadro verde donde debes colocar el código de barras</li>
                <li>Mantén el código a 15-20 cm de la cámara</li>
                <li>Asegúrate de tener buena iluminación</li>
                <li>La detección es automática cuando encuentra el código</li>
              </ol>
            </div>

            {/* Contenedor del escáner */}
            <div style={{
              backgroundColor: '#f7fafc',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '15px',
              minHeight: '300px',
              border: '2px solid #e2e8f0'
            }}>
              <div 
                id="barcode-reader" 
                ref={barcodeReaderRef}
                style={{ width: '100%' }}
              ></div>
            </div>

            {/* Controles */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  stopCamera();
                  setTimeout(() => {
                    handleModeChange('camera');
                  }, 100);
                }}
                className="btn btn-warning"
                style={{ flex: 1, padding: '10px' }}
              >
                Reintentar
              </button>
              
              <button
                onClick={() => handleModeChange('manual')}
                className="btn btn-danger"
                style={{ flex: 1, padding: '10px' }}
              >
                Cancelar y usar Manual
              </button>
            </div>
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
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;