-- ============================================================
--  INVENTARIO PRO V5 — migration_v5.sql
--  Ejecutar SOBRE una base de datos V4 existente.
--  NO borra datos existentes.
-- ============================================================

USE inventario_pro;

-- ─────────────────────────────────────────
--  FEATURE 1: MULTI-SUCURSAL
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sucursales (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL,
  direccion  TEXT,
  telefono   VARCHAR(30),
  email      VARCHAR(100),
  activo     TINYINT(1) DEFAULT 1,
  es_principal TINYINT(1) DEFAULT 0,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock por sucursal
CREATE TABLE IF NOT EXISTS stock_sucursales (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  sucursal_id INT NOT NULL,
  stock       INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 5,
  UNIQUE KEY uq_prod_suc (producto_id, sucursal_id),
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

-- Asignar sucursal a usuarios
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS sucursal_id INT NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_usuario_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- Vincular ventas a sucursal
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS sucursal_id INT NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_venta_sucursal
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
--  FEATURE 4: DESCUENTOS Y PROMOCIONES
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS descuentos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  codigo        VARCHAR(50) UNIQUE NOT NULL,
  nombre        VARCHAR(150) NOT NULL,
  tipo          ENUM('porcentaje','monto_fijo') NOT NULL DEFAULT 'porcentaje',
  valor         DECIMAL(12,2) NOT NULL DEFAULT 0,
  aplica_a      ENUM('todos','categoria','producto','cliente') DEFAULT 'todos',
  referencia_id INT NULL,
  activo        TINYINT(1) DEFAULT 1,
  fecha_inicio  DATE NULL,
  fecha_fin     DATE NULL,
  uso_maximo    INT NULL,
  usos          INT NOT NULL DEFAULT 0,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registrar descuento usado en venta
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS descuento_id INT NULL,
  ADD COLUMN IF NOT EXISTS descuento_codigo VARCHAR(50) NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_venta_descuento
    FOREIGN KEY (descuento_id) REFERENCES descuentos(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
--  FEATURE 5: CONTROL DE CAJA / TURNOS
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS turnos_caja (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id    INT NOT NULL,
  sucursal_id   INT NULL,
  monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_final   DECIMAL(12,2) NULL,
  monto_esperado DECIMAL(12,2) NULL,
  diferencia    DECIMAL(12,2) NULL,
  estado        ENUM('abierto','cerrado') DEFAULT 'abierto',
  notas_cierre  TEXT,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cerrado_en    TIMESTAMP NULL,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE RESTRICT,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  turno_id    INT NOT NULL,
  tipo        ENUM('ingreso','egreso','venta','devolucion') NOT NULL,
  monto       DECIMAL(12,2) NOT NULL,
  descripcion VARCHAR(300),
  referencia_id INT NULL,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (turno_id) REFERENCES turnos_caja(id) ON DELETE CASCADE
);

-- Vincular venta a turno de caja
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS turno_id INT NULL,
  ADD CONSTRAINT IF NOT EXISTS fk_venta_turno
    FOREIGN KEY (turno_id) REFERENCES turnos_caja(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
--  DATOS INICIALES V5
-- ─────────────────────────────────────────

-- Sucursal principal
INSERT IGNORE INTO sucursales (id, nombre, direccion, telefono, activo, es_principal)
VALUES (1, 'Sucursal Principal', 'Calle 123 # 45-67', '+57 300 000 0000', 1, 1);

-- Poblar stock_sucursales con stock actual de productos
INSERT IGNORE INTO stock_sucursales (producto_id, sucursal_id, stock, stock_minimo)
SELECT id, 1, stock, stock_minimo FROM productos WHERE activo = 1;

-- Asignar sucursal principal a usuarios existentes
UPDATE usuarios SET sucursal_id = 1 WHERE sucursal_id IS NULL;

-- Descuentos de ejemplo
INSERT IGNORE INTO descuentos (codigo, nombre, tipo, valor, aplica_a, activo, fecha_inicio, fecha_fin) VALUES
  ('BIENVENIDO10', 'Bienvenida 10%',     'porcentaje', 10,    'todos',    1, NULL, NULL),
  ('DESC5K',       'Descuento $5.000',   'monto_fijo', 5000,  'todos',    1, NULL, NULL),
  ('VIP20',        'VIP 20% descuento',  'porcentaje', 20,    'cliente',  0, NULL, NULL);

-- ─────────────────────────────────────────
--  VERIFICACIÓN
-- ─────────────────────────────────────────
SELECT '✅ Migration V5 aplicada correctamente' AS resultado;
SELECT CONCAT('   Sucursales: ', COUNT(*)) AS info FROM sucursales;
SELECT CONCAT('   Descuentos: ', COUNT(*)) AS info FROM descuentos;
