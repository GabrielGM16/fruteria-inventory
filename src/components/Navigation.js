// Actualizar src/components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: '📊' },
    { path: '/inventario', name: 'Inventario', icon: '📦' },
    { path: '/entradas', name: 'Entradas', icon: '📥' },
    { path: '/ventas', name: 'Ventas', icon: '💰' },
    { path: '/mermas', name: 'Mermas', icon: '⚠️' },
    { path: '/estadisticas', name: 'Estadísticas', icon: '📈' },
    { path: '/proveedores', name: 'Proveedores', icon: '👥' }, // ✨ NUEVO
    { path: '/pago-tarjeta', name: 'Pago Tarjeta', icon: '💳' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h2>🍎 Frutería Control</h2>
      </div>
      <ul className="nav-menu">
        {menuItems.map((item) => (
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