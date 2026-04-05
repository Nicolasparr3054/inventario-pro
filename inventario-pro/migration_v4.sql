-- ============================================================
--  INVENTARIO PRO V4 — Migración
--  Ejecutar DESPUÉS de migration_v3.sql
-- ============================================================

USE inventario_pro;

-- ─────────────────────────────────────────
-- 1. Devoluciones de ventas
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS devoluciones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  venta_id        INT NOT NULL,
  numero          VARCHAR(30) UNIQUE NOT NULL,
  motivo          TEXT,
  total_devuelto  DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado          ENUM('aprobada','pendiente','rechazada') DEFAULT 'aprobada',
  usuario_id      INT,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id)   REFERENCES ventas(id)    ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)  ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS devolucion_detalles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  devolucion_id   INT NOT NULL,
  producto_id     INT NOT NULL,
  cantidad        INT NOT NULL,
  precio_unit     DECIMAL(12,2) NOT NULL,
  subtotal        DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id)   REFERENCES productos(id)    ON DELETE RESTRICT
);

-- Flag en ventas para marcar si tiene devoluciones
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS tiene_devolucion TINYINT(1) DEFAULT 0;

-- ─────────────────────────────────────────
-- 2. Órdenes de compra
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  numero          VARCHAR(30) UNIQUE NOT NULL,
  proveedor_id    INT NOT NULL,
  estado          ENUM('borrador','enviada','recibida','cancelada') DEFAULT 'borrador',
  subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
  total           DECIMAL(12,2) NOT NULL DEFAULT 0,
  notas           TEXT,
  fecha_entrega   DATE,
  usuario_id      INT,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS orden_compra_detalles (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  orden_id          INT NOT NULL,
  producto_id       INT NOT NULL,
  cantidad          INT NOT NULL,
  cantidad_recibida INT NOT NULL DEFAULT 0,
  precio_unit       DECIMAL(12,2) NOT NULL,
  subtotal          DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (orden_id)    REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id)      ON DELETE RESTRICT
);

-- ─────────────────────────────────────────
-- 3. Configuración de empresa (para facturas)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresa_config (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  clave          VARCHAR(50) UNIQUE NOT NULL,
  valor          TEXT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Datos por defecto
INSERT IGNORE INTO empresa_config (clave, valor) VALUES
  ('nombre',      'Mi Empresa S.A.S.'),
  ('nit',         '900.000.000-0'),
  ('direccion',   'Calle 123 # 45-67'),
  ('telefono',    '+57 300 000 0000'),
  ('email',       'info@miempresa.com'),
  ('ciudad',      'Bogotá, Colombia'),
  ('logo_url',    ''),
  ('moneda',      'COP'),
  ('pie_factura', '¡Gracias por su compra!');

-- ─────────────────────────────────────────
-- 4. Notificaciones en tiempo real
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  tipo             ENUM('stock_bajo','devolucion','orden_compra','sistema') NOT NULL,
  titulo           VARCHAR(200) NOT NULL,
  mensaje          TEXT,
  leida            TINYINT(1) DEFAULT 0,
  usuario_id       INT,
  referencia_id    INT,
  referencia_tipo  VARCHAR(50),
  creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
