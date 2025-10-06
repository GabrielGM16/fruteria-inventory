// Actualizar src/components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { user, hasPermission, hasRole, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: '📊', permission: null },
    { path: '/inventario', name: 'Inventario', icon: '📦', permission: 'inventario_lectura' },
    { path: '/entradas', name: 'Entradas', icon: '📥', permission: 'entradas_lectura' },
    { path: '/ventas', name: 'Ventas', icon: '💰', permission: 'ventas_lectura' },
    { path: '/mermas', name: 'Mermas', icon: '⚠️', permission: 'mermas_lectura' },
    { path: '/estadisticas', name: 'Estadísticas', icon: '📈', permission: 'reportes_lectura' },
    { path: '/proveedores', name: 'Proveedores', icon: '👥', roles: ['admin', 'dueño'] },
    { path: '/usuarios', name: 'Usuarios', icon: '👤', permission: 'usuarios_lectura' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    console.log('🔍 DEBUG - Filtering menu item:', item.name, { permission: item.permission, roles: item.roles });
    
    if (item.permission) {
      const hasAccess = hasPermission(item.permission);
      console.log('🔍 DEBUG - Permission check result:', item.name, hasAccess);
      return hasAccess;
    }
    if (item.roles) {
      const hasAccess = item.roles.some(role => hasRole(role));
      console.log('🔍 DEBUG - Role check result:', item.name, hasAccess);
      return hasAccess;
    }
    console.log('🔍 DEBUG - Default access (Dashboard):', item.name);
    return true; // Dashboard is accessible to all authenticated users
  });

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h2>🍎 Frutería Control</h2>
        {user && (
          <div style={{ 
            marginTop: '10px', 
            padding: '8px', 
            backgroundColor: '#f7fafc', 
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#4a5568'
          }}>
            <div><strong>{user.nombre_completo}</strong></div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '4px'
            }}>
              <span style={{
                padding: '2px 6px',
                backgroundColor: user.rol === 'admin' ? '#e53e3e' : user.rol === 'dueño' ? '#3182ce' : '#38a169',
                color: 'white',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: 'bold'
              }}>
                {user.rol.toUpperCase()}
              </span>
              <button 
                onClick={logout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e53e3e',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '2px 4px'
                }}
                title="Cerrar sesión"
              >
                🚪
              </button>
            </div>
          </div>
        )}
      </div>
      <ul className="nav-menu">
        {filteredMenuItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;