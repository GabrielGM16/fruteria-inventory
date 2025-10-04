import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    nombre_completo: '',
    email: '',
    password: '',
    rol_id: '',
    activo: true
  });
  const [errors, setErrors] = useState({});
  const { user, hasPermission } = useAuth();
  const toast = useToast();

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validaciones
    const newErrors = {};
    if (!formData.nombre_usuario.trim()) newErrors.nombre_usuario = 'El nombre de usuario es requerido';
    if (!formData.nombre_completo.trim()) newErrors.nombre_completo = 'El nombre completo es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    if (!formData.rol_id) newErrors.rol_id = 'El rol es requerido';
    if (!editingUser && !formData.password.trim()) newErrors.password = 'La contraseña es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
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
        loadUsers();
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
      nombre_usuario: user.nombre_usuario,
      nombre_completo: user.nombre_completo,
      email: user.email,
      password: '',
      rol_id: user.rol_id,
      activo: user.activo
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ activo: !currentStatus })
      });

      if (response.ok) {
        toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
        loadUsers();
      } else {
        toast.error('Error al cambiar estado del usuario');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre_usuario: '',
      nombre_completo: '',
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

  const getRoleName = (rolId) => {
    const rol = roles.find(r => r.id === rolId);
    return rol ? rol.nombre : 'Desconocido';
  };

  const getRoleBadgeColor = (rolName) => {
    switch (rolName.toLowerCase()) {
      case 'admin': return '#e53e3e';
      case 'dueño': return '#3182ce';
      case 'vendedor': return '#38a169';
      default: return '#718096';
    }
  };

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  if (!hasPermission('usuarios_lectura')) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          No tienes permisos para acceder a esta sección.
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="page-subtitle">Administrar usuarios y roles del sistema</p>
          </div>
          {hasPermission('usuarios_escritura') && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              ➕ Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Usuario</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Nombre Completo</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Rol</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Estado</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr key={userItem.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px' }}>
                    <strong>{userItem.nombre_usuario}</strong>
                  </td>
                  <td style={{ padding: '12px' }}>{userItem.nombre_completo}</td>
                  <td style={{ padding: '12px' }}>{userItem.email}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: getRoleBadgeColor(getRoleName(userItem.rol_id))
                    }}>
                      {getRoleName(userItem.rol_id).toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: userItem.activo ? '#38a169' : '#e53e3e'
                    }}>
                      {userItem.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {hasPermission('usuarios_escritura') && (
                        <>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleEdit(userItem)}
                            title="Editar usuario"
                          >
                            ✏️
                          </button>
                          <button
                            className={`btn btn-sm ${userItem.activo ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(userItem.id, userItem.activo)}
                            title={userItem.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {userItem.activo ? '🔒' : '🔓'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
            No hay usuarios registrados
          </div>
        )}
      </div>

      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre de Usuario *</label>
                  <input
                    type="text"
                    value={formData.nombre_usuario}
                    onChange={(e) => setFormData({...formData, nombre_usuario: e.target.value})}
                    className={errors.nombre_usuario ? 'error' : ''}
                    placeholder="Ingrese el nombre de usuario"
                  />
                  {errors.nombre_usuario && <span className="error-text">{errors.nombre_usuario}</span>}
                </div>

                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                    className={errors.nombre_completo ? 'error' : ''}
                    placeholder="Ingrese el nombre completo"
                  />
                  {errors.nombre_completo && <span className="error-text">{errors.nombre_completo}</span>}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={errors.email ? 'error' : ''}
                    placeholder="Ingrese el email"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Contraseña {!editingUser && '*'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={errors.password ? 'error' : ''}
                    placeholder={editingUser ? "Dejar vacío para mantener actual" : "Ingrese la contraseña"}
                  />
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={formData.rol_id}
                    onChange={(e) => setFormData({...formData, rol_id: e.target.value})}
                    className={errors.rol_id ? 'error' : ''}
                  >
                    <option value="">Seleccione un rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre} - {rol.descripcion}
                      </option>
                    ))}
                  </select>
                  {errors.rol_id && <span className="error-text">{errors.rol_id}</span>}
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    />
                    Usuario activo
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Actualizar' : 'Crear'} Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;