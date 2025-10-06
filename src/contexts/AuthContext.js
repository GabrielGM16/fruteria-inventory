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
          console.log('🔍 DEBUG - Usuario validado:', response.data.user);
          console.log('🔍 PERMISOS COMPLETOS:', JSON.stringify(response.data.user.permisos, null, 2));
          console.log('🔍 TIPO DE PERMISOS:', typeof response.data.user.permisos);
          console.log('🔍 KEYS DE PERMISOS:', Object.keys(response.data.user.permisos || {}));
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
        
        console.log('🔍 DEBUG - Login exitoso, datos del usuario:', userData);
        console.log('🔍 PERMISOS EN LOGIN:', JSON.stringify(userData.permisos, null, 2));
        console.log('🔍 TIPO DE PERMISOS EN LOGIN:', typeof userData.permisos);
        console.log('🔍 KEYS DE PERMISOS EN LOGIN:', Object.keys(userData.permisos || {}));
        
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
    if (!user || !user.permisos) {
      console.log('🔍 DEBUG - hasPermission: No user or no permisos', { user: !!user, permisos: user?.permisos });
      return false;
    }
    
    const permissions = user.permisos;
    console.log('🔍 DEBUG - hasPermission called:', { module, action, permissions });
    console.log('🔍 ESTRUCTURA PERMISOS EN hasPermission:', JSON.stringify(permissions, null, 2));
    
    // Mapeo de español a inglés para los nombres de módulos
    const moduleMapping = {
      'inventario': 'inventory',
      'ventas': 'sales',
      'entradas': 'entries',
      'usuarios': 'users',
      'reportes': 'reports',
      'mermas': 'mermas', // Ya está igual
      'configuracion': 'settings',
      'dashboard': 'dashboard'
    };
    
    // Mapeo de español a inglés para las acciones
    const actionMapping = {
      'lectura': 'read',
      'escritura': 'create', // o 'update' dependiendo del contexto
      'crear': 'create',
      'actualizar': 'update',
      'eliminar': 'delete',
      'exportar': 'export'
    };
    
    // Admin has all permissions
    if (permissions.all) {
      console.log('🔍 DEBUG - Admin has all permissions');
      return true;
    }
    
    // Handle single parameter format (e.g., 'usuarios_lectura')
    if (action === undefined) {
      // First, check if the permission exists directly (e.g., 'usuarios_lectura': true)
      if (permissions[module] === true) {
        console.log('🔍 DEBUG - Direct permission found:', module, true);
        return true;
      }
      
      // If not found directly, try to split module_action format
      const parts = module.split('_');
      if (parts.length >= 2) {
        const moduleKey = parts[0];
        const actionKey = parts.slice(1).join('_');
        
        // Traducir nombres de español a inglés
        const translatedModule = moduleMapping[moduleKey] || moduleKey;
        const translatedAction = actionMapping[actionKey] || actionKey;
        
        console.log('🔍 DEBUG - Trying split format:', { 
          moduleKey, 
          actionKey, 
          translatedModule, 
          translatedAction, 
          modulePermissions: permissions[translatedModule] 
        });
        
        if (permissions[translatedModule]) {
          // If permission is boolean (true = all actions allowed)
          if (typeof permissions[translatedModule] === 'boolean') {
            console.log('🔍 DEBUG - Module permission is boolean:', permissions[translatedModule]);
            return permissions[translatedModule];
          }
          
          // If permission is object, check specific action
          if (typeof permissions[translatedModule] === 'object') {
            const result = permissions[translatedModule][translatedAction] === true;
            console.log('🔍 DEBUG - Module permission is object, action result:', result);
            return result;
          }
        }
      }
      
      console.log('🔍 DEBUG - Permission not found:', module);
      return false;
    }
    
    // Handle two parameter format (module, action)
    // Traducir nombres de español a inglés
    const translatedModule = moduleMapping[module] || module;
    const translatedAction = actionMapping[action] || action;
    
    console.log('🔍 DEBUG - Two parameter format:', { 
      module, 
      action, 
      translatedModule, 
      translatedAction 
    });
    
    // Check specific module permissions
    if (!permissions[translatedModule]) return false;
    
    // If permission is boolean (true = all actions allowed)
    if (typeof permissions[translatedModule] === 'boolean') {
      return permissions[translatedModule];
    }
    
    // If permission is object, check specific action
    if (typeof permissions[translatedModule] === 'object') {
      return permissions[translatedModule][translatedAction] === true;
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