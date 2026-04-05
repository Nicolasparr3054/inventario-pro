-- ============================================================
--  INVENTARIO PRO - Base de Datos
--  Ejecutar en MySQL Workbench
--  Versión: 1.0.0
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventario_pro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventario_pro;

-- ─────────────────────────────────────────
--  TABLA: categorias
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  color       VARCHAR(7) DEFAULT '#6366f1',
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  TABLA: proveedores
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(150) NOT NULL,
  contacto  VARCHAR(100),
  telefono  VARCHAR(20),
  email     VARCHAR(100),
  direccion TEXT,
  activo    TINYINT(1) DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  TABLA: productos
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  codigo        VARCHAR(50) UNIQUE NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  descripcion   TEXT,
  categoria_id  INT,
  proveedor_id  INT,
  precio_compra DECIMAL(12,2) NOT NULL DEFAULT 0,
  precio_venta  DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock         INT NOT NULL DEFAULT 0,
  stock_minimo  INT NOT NULL DEFAULT 5,
  imagen_url    VARCHAR(500),
  activo        TINYINT(1) DEFAULT 1,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
--  TABLA: clientes
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(150) NOT NULL,
  email     VARCHAR(100),
  telefono  VARCHAR(20),
  direccion TEXT,
  nit       VARCHAR(30),
  activo    TINYINT(1) DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  TABLA: ventas
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  numero_venta  VARCHAR(20) UNIQUE NOT NULL,
  cliente_id    INT,
  subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0,
  impuesto      DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento     DECIMAL(12,2) NOT NULL DEFAULT 0,
  total         DECIMAL(12,2) NOT NULL DEFAULT 0,
  metodo_pago   ENUM('efectivo','tarjeta','transferencia','otro') DEFAULT 'efectivo',
  estado        ENUM('completada','pendiente','cancelada') DEFAULT 'completada',
  notas         TEXT,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
--  TABLA: venta_detalles
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venta_detalles (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  venta_id     INT NOT NULL,
  producto_id  INT NOT NULL,
  cantidad     INT NOT NULL,
  precio_unit  DECIMAL(12,2) NOT NULL,
  subtotal     DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (venta_id)    REFERENCES ventas(id)    ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- ─────────────────────────────────────────
--  TABLA: movimientos_inventario
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  producto_id   INT NOT NULL,
  tipo          ENUM('entrada','salida','ajuste') NOT NULL,
  cantidad      INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo   INT NOT NULL,
  motivo        VARCHAR(200),
  referencia_id INT,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  TABLA: usuarios
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  rol        ENUM('admin','vendedor','almacenista') DEFAULT 'vendedor',
  activo     TINYINT(1) DEFAULT 1,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  TRIGGER: descontar stock al vender
-- ─────────────────────────────────────────
DELIMITER $$
CREATE TRIGGER after_venta_detalle_insert
AFTER INSERT ON venta_detalles
FOR EACH ROW
BEGIN
  DECLARE stock_ant INT;
  SELECT stock INTO stock_ant FROM productos WHERE id = NEW.producto_id;
  UPDATE productos SET stock = stock - NEW.cantidad WHERE id = NEW.producto_id;
  INSERT INTO movimientos_inventario
    (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, referencia_id)
  VALUES
    (NEW.producto_id, 'salida', NEW.cantidad, stock_ant, stock_ant - NEW.cantidad, 'Venta', NEW.venta_id);
END$$
DELIMITER ;

-- ─────────────────────────────────────────
--  DATOS INICIALES
-- ─────────────────────────────────────────
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@inventariopro.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Contraseña por defecto: password

INSERT INTO categorias (nombre, descripcion, color) VALUES
  ('Electrónica',   'Dispositivos y accesorios electrónicos', '#6366f1'),
  ('Ropa',          'Prendas de vestir y accesorios',         '#ec4899'),
  ('Alimentos',     'Productos alimenticios y bebidas',       '#22c55e'),
  ('Herramientas',  'Herramientas y ferretería',              '#f59e0b'),
  ('Oficina',       'Artículos de oficina y papelería',       '#3b82f6');

INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES
  ('TechSupply S.A.S',    'Carlos López',   '3001234567', 'ventas@techsupply.co'),
  ('Distribuidora Norte', 'Ana Martínez',   '3109876543', 'ana@distnorte.co'),
  ('Importaciones XYZ',   'Pedro Gómez',    '3157654321', 'pedro@impxyz.co');

INSERT INTO clientes (nombre, email, telefono, nit) VALUES
  ('Cliente General', '',                '',            '222222222-2'),
  ('María García',    'maria@email.com',  '3001112222',  '900123456-1'),
  ('Juan Pérez',      'juan@email.com',   '3103334444',  '900789012-3');

INSERT INTO productos (codigo, nombre, descripcion, categoria_id, proveedor_id, precio_compra, precio_venta, stock, stock_minimo) VALUES
  ('ELEC-001', 'Audífonos Bluetooth', 'Audífonos inalámbricos 40h batería', 1, 1, 45000,  89900,  25, 5),
  ('ELEC-002', 'Cable USB-C 2m',      'Cable de carga rápida 65W',          1, 1,  8000,  18900,  80, 10),
  ('ELEC-003', 'Teclado Mecánico',    'Teclado gaming RGB switches blue',   1, 1, 120000, 229900,  12, 3),
  ('OFIC-001', 'Resma Papel A4',      '500 hojas bond 75g',                 5, 2,  10000,  18500,  60, 10),
  ('OFIC-002', 'Bolígrafos x12',      'Pack 12 bolígrafos negros',          5, 2,   4500,   9900, 100, 20),
  ('HERR-001', 'Destornillador Set',  'Set 32 piezas magnético',            4, 3,  25000,  49900,  18, 4);