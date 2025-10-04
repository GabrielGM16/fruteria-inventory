// Actualizar src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importar componentes
import Dashboard from './components/Dashboard';
import Inventario from './components/Inventario';
import Entradas from './components/Entradas';
import Ventas from './components/Ventas';
import Mermas from './components/Mermas';
import Estadisticas from './components/Estadisticas';
import Proveedores from './components/Proveedores'; // ✨ NUEVO
import Navigation from './components/Navigation';
import { ToastProvider } from './components/Toast'; // ✨ NUEVO

function App() {
  return (
    <ToastProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <div className="App">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/entradas" element={<Entradas />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/mermas" element={<Mermas />} />
              <Route path="/estadisticas" element={<Estadisticas />} />
              <Route path="/proveedores" element={<Proveedores />} /> {/* ✨ NUEVO */}
            </Routes>
          </main>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;