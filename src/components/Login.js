// Login Component - Professional Design with Inline Styles
import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 3) {
      newErrors.password = 'La contraseña debe tener al menos 3 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await login(formData.username, formData.password);

      if (!result.success) {
        setErrors({
          general: result.message || 'Error al iniciar sesión'
        });
      }
    } catch (error) {
      setErrors({
        general: 'Error de conexión. Intenta nuevamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Estilos inline para evitar conflictos con CSS globales
  const containerStyle = {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    position: 'relative',
    overflow: 'hidden'
  };

  const backgroundDecorStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 1
  };

  const decorElement1Style = {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '24rem',
    height: '24rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    filter: 'blur(60px)'
  };

  const decorElement2Style = {
    position: 'absolute',
    bottom: '25%',
    right: '25%',
    width: '20rem',
    height: '20rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    filter: 'blur(60px)'
  };

  const cardContainerStyle = {
    maxWidth: '28rem',
    width: '100%',
    position: 'relative',
    zIndex: 10
  };

  const cardStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    border: 'none'
  };

  const headerStyle = {
    padding: '2.5rem 2rem 2rem 2rem',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    textAlign: 'center',
    color: '#ffffff'
  };

  const iconContainerStyle = {
    margin: '0 auto 1rem auto',
    height: '4rem',
    width: '4rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };

  const titleStyle = {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#ffffff',
    margin: '0 0 0.5rem 0',
    lineHeight: '1.2'
  };

  const subtitleStyle = {
    color: 'rgba(199, 210, 254, 1)',
    fontSize: '0.875rem',
    margin: 0
  };

  const formContainerStyle = {
    padding: '2rem 2rem 2.5rem 2rem'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  };

  const errorAlertStyle = {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #ef4444',
    padding: '1rem',
    borderRadius: '0 0.5rem 0.5rem 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem'
  };

  const errorTextStyle = {
    fontSize: '0.875rem',
    color: '#dc2626',
    margin: 0
  };

  const fieldContainerStyle = {
    display: 'flex',
    flexDirection: 'column'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  };

  const inputContainerStyle = {
    position: 'relative'
  };

  const inputIconStyle = {
    position: 'absolute',
    top: '50%',
    left: '0.75rem',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#9ca3af'
  };

  const getInputStyle = (hasError) => ({
    display: 'block',
    width: '100%',
    paddingLeft: '2.5rem',
    paddingRight: showPassword ? '3rem' : '0.75rem',
    paddingTop: '0.75rem',
    paddingBottom: '0.75rem',
    border: `2px solid ${hasError ? '#fca5a5' : '#d1d5db'}`,
    borderRadius: '0.5rem',
    fontSize: '1rem',
    color: '#111827',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  });

  const inputFocusStyle = {
    borderColor: '#4f46e5',
    boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)'
  };

  const passwordToggleStyle = {
    position: 'absolute',
    top: '50%',
    right: '0.75rem',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '0.25rem',
    transition: 'color 0.2s ease-in-out'
  };

  const fieldErrorStyle = {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#dc2626'
  };

  const getButtonStyle = () => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#ffffff',
    background: loading 
      ? '#a5b4fc' 
      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    transform: loading ? 'none' : 'scale(1)',
    boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    outline: 'none',
    fontFamily: 'inherit'
  });

  const buttonHoverStyle = {
    transform: 'scale(1.02)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };

  const demoCredentialsStyle = {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb'
  };

  const demoTitleStyle = {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const demoItemStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '0.25rem',
    border: '1px solid #f3f4f6',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s ease-in-out'
  };

  const demoLabelStyle = {
    color: '#6b7280'
  };

  const demoValueStyle = {
    color: '#4f46e5',
    fontFamily: 'monospace',
    fontSize: '0.75rem'
  };

  const footerStyle = {
    marginTop: '1.5rem',
    textAlign: 'center'
  };

  const footerTextStyle = {
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: 0
  };

  return (
    <div style={containerStyle}>
      {/* Background decorative elements */}
      <div style={backgroundDecorStyle}>
        <div style={decorElement1Style}></div>
        <div style={decorElement2Style}></div>
      </div>

      <div style={cardContainerStyle}>
        {/* Main Card */}
        <div style={cardStyle}>
          
          {/* Header Section */}
          <div style={headerStyle}>
            <div style={iconContainerStyle}>
              <svg style={{ height: '2.25rem', width: '2.25rem', color: '#ffffff' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 style={titleStyle}>
              Frutería Inventory
            </h1>
            <p style={subtitleStyle}>
              Sistema de Gestión de Inventario
            </p>
          </div>

          {/* Form Section */}
          <div style={formContainerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
              
              {/* General Error Alert */}
              {errors.general && (
                <div style={errorAlertStyle}>
                  <div style={{ flexShrink: 0 }}>
                    <svg style={{ height: '1.25rem', width: '1.25rem', color: '#ef4444' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p style={errorTextStyle}>{errors.general}</p>
                  </div>
                </div>
              )}

              {/* Username Field */}
              <div style={fieldContainerStyle}>
                <label htmlFor="username" style={labelStyle}>
                  Usuario
                </label>
                <div style={inputContainerStyle}>
                  <div style={inputIconStyle}>
                    <svg style={{ height: '1.25rem', width: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    style={getInputStyle(errors.username)}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, getInputStyle(errors.username))}
                    placeholder="Ingresa tu usuario"
                  />
                </div>
                {errors.username && (
                  <p style={fieldErrorStyle}>{errors.username}</p>
                )}
              </div>

              {/* Password Field */}
              <div style={fieldContainerStyle}>
                <label htmlFor="password" style={labelStyle}>
                  Contraseña
                </label>
                <div style={inputContainerStyle}>
                  <div style={inputIconStyle}>
                    <svg style={{ height: '1.25rem', width: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    style={getInputStyle(errors.password)}
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => Object.assign(e.target.style, getInputStyle(errors.password))}
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    style={passwordToggleStyle}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseEnter={(e) => e.target.style.color = '#6b7280'}
                    onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                  >
                    {showPassword ? (
                      <svg style={{ height: '1.25rem', width: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg style={{ height: '1.25rem', width: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p style={fieldErrorStyle}>{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={getButtonStyle()}
                onMouseEnter={(e) => !loading && Object.assign(e.target.style, buttonHoverStyle)}
                onMouseLeave={(e) => !loading && Object.assign(e.target.style, getButtonStyle())}
                onMouseDown={(e) => !loading && (e.target.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
              >
                {loading ? (
                  <>
                    <svg style={{ animation: 'spin 1s linear infinite', marginLeft: '-0.25rem', marginRight: '0.75rem', height: '1.25rem', width: '1.25rem', color: '#ffffff' }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <svg style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Iniciar Sesión
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div style={demoCredentialsStyle}>
              <h4 style={demoTitleStyle}>
                Credenciales de Prueba
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div 
                  style={demoItemStyle}
                  onMouseEnter={(e) => e.target.style.borderColor = '#c7d2fe'}
                  onMouseLeave={(e) => e.target.style.borderColor = '#f3f4f6'}
                >
                  <span style={demoLabelStyle}>
                    <span style={{ fontWeight: '500', color: '#111827' }}>Admin:</span> admin
                  </span>
                  <span style={{ color: '#9ca3af' }}>•••</span>
                  <span style={demoValueStyle}>admin123</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <p style={footerTextStyle}>
            Sistema de Inventario v1.0
          </p>
        </div>
      </div>

      {/* Agregar keyframes para la animación de spin */}
      <style>
        {`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;