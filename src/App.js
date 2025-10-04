// Frutería Inventory App with Authentication
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Authentication
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';

// Components
import Dashboard from './components/Dashboard';
import Inventario from './components/Inventario';
import Entradas from './components/Entradas';
import Ventas from './components/Ventas';
import Mermas from './components/Mermas';
import Estadisticas from './components/Estadisticas';
import Proveedores from './components/Proveedores';
import UserManagement from './components/UserManagement';
import Navigation from './components/Navigation';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="main-content">
                    <Dashboard />
                  </main>
                </ProtectedRoute>
              } />
              
              <Route path="/inventario" element={
                <ProtectedRoute requiredPermission={{ module: 'inventory', action: 'read' }}>
                  <Navigation />
                  <main className="main-content">
                    <Inventario />
                  </main>
                </ProtectedRoute>
              } />
              
              <Route path="/entradas" element={
                <ProtectedRoute requiredPermission={{ module: 'entries', action: 'read' }}>
                  <Navigation />
                  <main className="main-content">
                    <Entradas />
                  </main>
                </ProtectedRoute>
              } />
              
              <Route path="/ventas" element={
                <ProtectedRoute requiredPermission={{ module: 'sales', action: 'read' }}>
                  <Navigation />
                  <main className="main-content">
                    <Ventas />
                  </main>
                </ProtectedRoute>
              } />
              
              <Route path="/mermas" element={
                <ProtectedRoute requiredPermission={{ module: 'mermas', action: 'read' }}>
                  <Navigation />
                  <main className="main-content">
                    <Mermas />
                  </main>
                </ProtectedRoute>
              } />
              
              <Route path="/estadisticas" element={
                <ProtectedRoute requiredPermission={{ module: 'reports', action: 'read' }}>
                  <Navigation />
                  <main className="main-content">
                    <Estadisticas />
                  </main>
                </ProtectedRoute>
              } />
              
              <Route path="/proveedores" element={
                <ProtectedRoute requiredRoles={['admin', 'dueño']}>
                  <Navigation />
                  <main className="main-content">
                    <Proveedores />
                  </main>
                </ProtectedRoute>
              } />
              
              <Route path="/usuarios" element={
                <ProtectedRoute requiredPermission="usuarios_lectura">
                  <Navigation />
                  <main className="main-content">
                    <UserManagement />
                  </main>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;