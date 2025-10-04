// Authentication Context for Role-based Access Control
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/validate');
        if (response.data.valid) {
          setUser(response.data.user);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error de conexión' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const hasPermission = (module, action) => {
    if (!user || !user.permisos) return false;
    
    const permissions = user.permisos;
    
    // Admin has all permissions
    if (permissions.all) return true;
    
    // Check specific module permissions
    if (!permissions[module]) return false;
    
    // If permission is boolean (true = all actions allowed)
    if (typeof permissions[module] === 'boolean') {
      return permissions[module];
    }
    
    // If permission is object, check specific action
    if (typeof permissions[module] === 'object') {
      return permissions[module][action] === true;
    }
    
    return false;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.rol);
    }
    
    return user.rol === roles;
  };

  const canAccessModule = (module) => {
    return hasPermission(module, 'read') || hasPermission(module, 'create');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    canAccessModule,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};