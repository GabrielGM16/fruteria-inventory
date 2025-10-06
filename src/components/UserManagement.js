import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({
    general: {
      total_usuarios: 0,
      usuarios_activos: 0,
      usuarios_inactivos: 0,
      total_roles: 0
    },
    por_rol: []
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    current: 1,
    limit: 25
  });
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    email: '',
    password: '',
    rol_id: '',
    activo: true
  });
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { user, hasPermission } = useAuth();
  const toast = useToast();

  const loadUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 25,
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole && { rol_id: filterRole }),
        ...(filterStatus !== '' && { activo: filterStatus })
      });

      const response = await fetch(`http://localhost:3001/api/users/admin/usuarios?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    }
  }, [currentPage, searchTerm, filterRole, filterStatus, toast]);

  const loadRoles = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/admin/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/admin/usuarios/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadUsers(), loadRoles(), loadStats()]);
      setLoading(false);
    };
    loadData();
  }, [loadUsers, loadRoles, loadStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'El nombre de usuario es requerido';
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre completo es requerido';
    if (!formData.rol_id) newErrors.rol_id = 'El rol es requerido';
    if (!editingUser && !formData.password.trim()) newErrors.password = 'La contraseña es requerida';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingUser 
        ? `http://localhost:3001/api/users/admin/usuarios/${editingUser.id}` 
        : 'http://localhost:3001/api/users/admin/usuarios';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        setShowModal(false);
        resetForm();
        await Promise.all([loadUsers(), loadStats()]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Error al guardar usuario');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      nombre: user.nombre,
      email: user.email || '',
      password: '',
      rol_id: user.rol_id,
      activo: user.activo
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/admin/usuarios/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
        await Promise.all([loadUsers(), loadStats()]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al cambiar estado del usuario');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const handleDelete = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/admin/usuarios/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast.success('Usuario eliminado exitosamente');
        setShowDeleteConfirm(null);
        await Promise.all([loadUsers(), loadStats()]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      nombre: '',
      email: '',
      password: '',
      rol_id: '',
      activo: true
    });
    setEditingUser(null);
    setErrors({});
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const getRoleBadgeColor = (rolName) => {
    switch (rolName?.toLowerCase()) {
      case 'admin': return '#e53e3e';
      case 'administrador': return '#e53e3e';
      case 'dueño': return '#3182ce';
      case 'supervisor': return '#805ad5';
      case 'vendedor': return '#38a169';
      case 'cajero': return '#ed8936';
      default: return '#718096';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Cargando usuarios...
      </div>
    );
  }

  if (!user || user.rol !== 'admin') {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f56565, #e53e3e)',
        color: 'white',
        borderRadius: '12px',
        margin: '20px'
      }}>
        <h2>⚠️ Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta sección. Se requieren permisos de administrador.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          color: '#2d3748',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          👥 Gestión de Usuarios
        </h1>
        <p style={{ color: '#718096', fontSize: '16px' }}>
          Administrar usuarios y roles del sistema
        </p>
      </div>

      {/* Statistics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Usuarios</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.general.total_usuarios}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #48bb78, #38a169)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Usuarios Activos</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.general.usuarios_activos}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f56565, #e53e3e)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Usuarios Inactivos</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.general.usuarios_inactivos}</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #ed8936, #dd6b20)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Total Roles</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.general.total_roles}</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ 
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
            {/* Search */}
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, username o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '300px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '150px',
                outline: 'none'
              }}
            >
              <option value="">Todos los roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.nombre}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '150px',
                outline: 'none'
              }}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Add User Button */}
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            ➕ Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f7fafc' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>Usuario</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>Rol</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>Estado</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>Último Login</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d3748' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} style={{ 
                  borderBottom: '1px solid #e2e8f0',
                  background: index % 2 === 0 ? 'white' : '#f9fafb'
                }}>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#2d3748', marginBottom: '4px' }}>
                        {user.nombre}
                      </div>
                      <div style={{ fontSize: '14px', color: '#718096' }}>
                        @{user.username}
                      </div>
                      {user.email && (
                        <div style={{ fontSize: '12px', color: '#a0aec0' }}>
                          {user.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      background: getRoleBadgeColor(user.rol_nombre),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {user.rol_nombre}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      background: user.activo ? '#c6f6d5' : '#fed7d7',
                      color: user.activo ? '#22543d' : '#742a2a',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {user.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#718096' }}>
                    {formatDate(user.ultimo_login)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(user)}
                        style={{
                          background: '#4299e1',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        title="Editar usuario"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.activo)}
                        style={{
                          background: user.activo ? '#f56565' : '#48bb78',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                        title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.activo ? '🔒' : '🔓'}
                      </button>
                      {user.username !== 'admin' && (
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          style={{
                            background: '#e53e3e',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          title="Eliminar usuario"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ 
            padding: '20px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: currentPage === 1 ? '#f7fafc' : 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ← Anterior
            </button>
            
            <span style={{ color: '#718096', fontSize: '14px' }}>
              Página {pagination.current} de {pagination.pages} ({pagination.total} usuarios)
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage === pagination.pages}
              style={{
                padding: '8px 16px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: currentPage === pagination.pages ? '#f7fafc' : 'white',
                cursor: currentPage === pagination.pages ? 'not-allowed' : 'pointer'
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '24px',
              color: '#2d3748'
            }}>
              {editingUser ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.username ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Ingrese el nombre de usuario"
                />
                {errors.username && (
                  <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                    {errors.username}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.nombre ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Ingrese el nombre completo"
                />
                {errors.nombre && (
                  <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                    {errors.nombre}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.email ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Ingrese el email (opcional)"
                />
                {errors.email && (
                  <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                    {errors.email}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  {editingUser ? 'Nueva Contraseña (dejar vacío para mantener actual)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.password ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder={editingUser ? 'Nueva contraseña (opcional)' : 'Ingrese la contraseña'}
                />
                {errors.password && (
                  <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                    {errors.password}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2d3748' }}>
                  Rol *
                </label>
                <select
                  value={formData.rol_id}
                  onChange={(e) => setFormData({...formData, rol_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.rol_id ? '2px solid #e53e3e' : '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.nombre} - {role.descripcion}
                    </option>
                  ))}
                </select>
                {errors.rol_id && (
                  <div style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                    {errors.rol_id}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span style={{ fontWeight: '600', color: '#2d3748' }}>Usuario activo</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#718096',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {editingUser ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#2d3748' }}>
              ¿Eliminar Usuario?
            </h3>
            <p style={{ color: '#718096', marginBottom: '24px' }}>
              Esta acción desactivará el usuario permanentemente. ¿Estás seguro?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#718096',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #f56565, #e53e3e)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;