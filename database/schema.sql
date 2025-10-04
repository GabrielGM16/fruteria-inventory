-- Frutería Inventory - Sistema de Roles y Usuarios
-- Database Schema Creation Script

-- Crear tabla de roles
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSON,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar roles iniciales
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('admin', 'Administrador del sistema', '{
    "dashboard": true,
    "inventory": {"read": true, "create": true, "update": true, "delete": true},
    "sales": {"read": true, "create": true, "update": true, "delete": true},
    "entries": {"read": true, "create": true, "update": true, "delete": true},
    "mermas": {"read": true, "create": true, "update": true, "delete": true},
    "reports": {"read": true, "export": true},
    "users": {"read": true, "create": true, "update": true, "delete": true},
    "settings": true
}'),
('dueño', 'Propietario del negocio', '{
    "dashboard": true,
    "inventory": {"read": true, "create": true, "update": true, "delete": false},
    "sales": {"read": true, "create": true, "update": true, "delete": false},
    "entries": {"read": true, "create": true, "update": true, "delete": false},
    "mermas": {"read": true, "create": true, "update": true, "delete": false},
    "reports": {"read": true, "export": true},
    "users": {"read": true, "create": {"roles": ["vendedor"]}, "update": {"roles": ["vendedor"]}, "delete": false},
    "settings": false
}'),
('vendedor', 'Cajero/Vendedor', '{
    "dashboard": true,
    "inventory": {"read": true, "create": false, "update": false, "delete": false},
    "sales": {"read": true, "create": true, "update": false, "delete": false},
    "entries": {"read": true, "create": true, "update": false, "delete": false},
    "mermas": {"read": false, "create": false, "update": false, "delete": false},
    "reports": {"read": false, "export": false},
    "users": {"read": false, "create": false, "update": false, "delete": false},
    "settings": false
}');

-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Insertar usuario administrador inicial (password: admin123)
INSERT INTO usuarios (username, password_hash, nombre, rol_id) VALUES
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Principal', 1);

-- Modificar tablas existentes para agregar usuario_id (si existen)
-- Nota: Estas modificaciones se aplicarán solo si las tablas ya existen

-- Agregar usuario_id a tabla ventas
ALTER TABLE ventas ADD COLUMN usuario_id INT;
ALTER TABLE ventas ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
CREATE INDEX idx_ventas_usuario ON ventas(usuario_id);

-- Agregar usuario_id a tabla entradas
ALTER TABLE entradas ADD COLUMN usuario_id INT;
ALTER TABLE entradas ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
CREATE INDEX idx_entradas_usuario ON entradas(usuario_id);

-- Agregar usuario_id a tabla mermas
ALTER TABLE mermas ADD COLUMN usuario_id INT;
ALTER TABLE mermas ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
CREATE INDEX idx_mermas_usuario ON mermas(usuario_id);

-- Crear vista para consultas de usuarios con roles
CREATE VIEW usuarios_con_roles AS
SELECT 
    u.id,
    u.username,
    u.nombre,
    u.email,
    u.activo,
    u.ultimo_login,
    u.created_at,
    r.nombre as rol_nombre,
    r.descripcion as rol_descripcion,
    r.permisos
FROM usuarios u
JOIN roles r ON u.rol_id = r.id;