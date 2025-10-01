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
import PagoTarjeta from './components/PagoTarjeta';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
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
            <Route path="/pago-tarjeta" element={<PagoTarjeta />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
