-- ============================================================
--  INVENTARIO PRO V4 — Script COMPLETO (instala todo desde cero)
--  Ejecuta ESTE ARCHIVO y nada más.
--  Borra y recrea la base de datos completa.
-- ============================================================

DROP DATABASE IF EXISTS inventario_pro;
CREATE DATABASE inventario_pro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventario_pro;

-- ─────────────────────────────────────────
--  TABLA: categorias
-- ─────────────────────────────────────────
CREATE TABLE categorias (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  color       VARCHAR(7) DEFAULT '#6366f1',
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  TABLA: proveedores
-- ─────────────────────────────────────────
CREATE TABLE proveedores (
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
--  TABLA: usuarios
-- ─────────────────────────────────────────
CREATE TABLE usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  rol        ENUM('admin','cajero','vendedor','almacenista') DEFAULT 'cajero',
  activo     TINYINT(1) DEFAULT 1,
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  TABLA: productos
-- ─────────────────────────────────────────
CREATE TABLE productos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  codigo         VARCHAR(50) UNIQUE NOT NULL,
  nombre         VARCHAR(200) NOT NULL,
  descripcion    TEXT,
  categoria_id   INT,
  proveedor_id   INT,
  precio_compra  DECIMAL(12,2) NOT NULL DEFAULT 0,
  precio_venta   DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock          INT NOT NULL DEFAULT 0,
  stock_minimo   INT NOT NULL DEFAULT 5,
  alerta_stock   TINYINT(1) DEFAULT 1,
  imagen_url     VARCHAR(1000),
  activo         TINYINT(1) DEFAULT 1,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
--  TABLA: clientes
-- ─────────────────────────────────────────
CREATE TABLE clientes (
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
CREATE TABLE ventas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  numero_venta     VARCHAR(20) UNIQUE NOT NULL,
  cliente_id       INT,
  usuario_id       INT,
  subtotal         DECIMAL(12,2) NOT NULL DEFAULT 0,
  impuesto         DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento        DECIMAL(12,2) NOT NULL DEFAULT 0,
  total            DECIMAL(12,2) NOT NULL DEFAULT 0,
  metodo_pago      ENUM('efectivo','tarjeta','transferencia','otro') DEFAULT 'efectivo',
  estado           ENUM('completada','pendiente','cancelada') DEFAULT 'completada',
  tiene_devolucion TINYINT(1) DEFAULT 0,
  notas            TEXT,
  notas_recibo     TEXT,
  impreso          TINYINT(1) DEFAULT 0,
  creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id)  REFERENCES clientes(id)  ON DELETE SET NULL,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE SET NULL
);

-- ─────────────────────────────────────────
--  TABLA: venta_detalles
-- ─────────────────────────────────────────
CREATE TABLE venta_detalles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  venta_id    INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad    INT NOT NULL,
  precio_unit DECIMAL(12,2) NOT NULL,
  subtotal    DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (venta_id)    REFERENCES ventas(id)    ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- ─────────────────────────────────────────
--  TABLA: movimientos_inventario
-- ─────────────────────────────────────────
CREATE TABLE movimientos_inventario (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  producto_id    INT NOT NULL,
  tipo           ENUM('entrada','salida','ajuste') NOT NULL,
  cantidad       INT NOT NULL,
  stock_anterior INT NOT NULL,
  stock_nuevo    INT NOT NULL,
  motivo         VARCHAR(200),
  referencia_id  INT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  TABLA: historial_precios
-- ─────────────────────────────────────────
CREATE TABLE historial_precios (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  producto_id            INT NOT NULL,
  precio_compra_anterior DECIMAL(12,2),
  precio_venta_anterior  DECIMAL(12,2),
  precio_compra_nuevo    DECIMAL(12,2),
  precio_venta_nuevo     DECIMAL(12,2),
  usuario_id             INT,
  creado_en              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE SET NULL
);

-- ─────────────────────────────────────────
--  TABLA: codigos_barras
-- ─────────────────────────────────────────
CREATE TABLE codigos_barras (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  codigo      VARCHAR(100) NOT NULL UNIQUE,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  TABLA: accesos_log
-- ─────────────────────────────────────────
CREATE TABLE accesos_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  email      VARCHAR(100),
  accion     ENUM('login','logout','login_fallido') NOT NULL,
  ip         VARCHAR(50),
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
--  V4: devoluciones
-- ─────────────────────────────────────────
CREATE TABLE devoluciones (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  venta_id       INT NOT NULL,
  numero         VARCHAR(30) UNIQUE NOT NULL,
  motivo         TEXT,
  total_devuelto DECIMAL(12,2) NOT NULL DEFAULT 0,
  estado         ENUM('aprobada','pendiente','rechazada') DEFAULT 'aprobada',
  usuario_id     INT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venta_id)   REFERENCES ventas(id)   ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE devolucion_detalles (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  devolucion_id INT NOT NULL,
  producto_id   INT NOT NULL,
  cantidad      INT NOT NULL,
  precio_unit   DECIMAL(12,2) NOT NULL,
  subtotal      DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (devolucion_id) REFERENCES devoluciones(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id)   REFERENCES productos(id)    ON DELETE RESTRICT
);

-- ─────────────────────────────────────────
--  V4: ordenes_compra
-- ─────────────────────────────────────────
CREATE TABLE ordenes_compra (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  numero         VARCHAR(30) UNIQUE NOT NULL,
  proveedor_id   INT NOT NULL,
  estado         ENUM('borrador','enviada','recibida','cancelada') DEFAULT 'borrador',
  subtotal       DECIMAL(12,2) NOT NULL DEFAULT 0,
  total          DECIMAL(12,2) NOT NULL DEFAULT 0,
  notas          TEXT,
  fecha_entrega  DATE,
  usuario_id     INT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id)    ON DELETE SET NULL
);

CREATE TABLE orden_compra_detalles (
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
--  V4: empresa_config
-- ─────────────────────────────────────────
CREATE TABLE empresa_config (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  clave          VARCHAR(50) UNIQUE NOT NULL,
  valor          TEXT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  V4: notificaciones
-- ─────────────────────────────────────────
CREATE TABLE notificaciones (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tipo            ENUM('stock_bajo','devolucion','orden_compra','sistema') NOT NULL,
  titulo          VARCHAR(200) NOT NULL,
  mensaje         TEXT,
  leida           TINYINT(1) DEFAULT 0,
  usuario_id      INT,
  referencia_id   INT,
  referencia_tipo VARCHAR(50),
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
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

-- Usuarios (password: "password" hasheado con bcrypt)
INSERT INTO usuarios (nombre, email, password, rol) VALUES
  ('Administrador', 'admin@inventariopro.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
  ('Cajero Demo',   'cajero@inventariopro.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cajero');

-- Categorías
INSERT INTO categorias (nombre, descripcion, color) VALUES
  ('Electrónica',  'Dispositivos y accesorios electrónicos', '#6366f1'),
  ('Ropa',         'Prendas de vestir y accesorios',         '#ec4899'),
  ('Alimentos',    'Productos alimenticios y bebidas',       '#22c55e'),
  ('Herramientas', 'Herramientas y ferretería',              '#f59e0b'),
  ('Oficina',      'Artículos de oficina y papelería',       '#3b82f6');

-- Proveedores
INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES
  ('TechSupply S.A.S',    'Carlos López',  '3001234567', 'ventas@techsupply.co'),
  ('Distribuidora Norte', 'Ana Martínez',  '3109876543', 'ana@distnorte.co'),
  ('Importaciones XYZ',   'Pedro Gómez',   '3157654321', 'pedro@impxyz.co');

-- Clientes
INSERT INTO clientes (nombre, email, telefono, nit) VALUES
  ('Cliente General', '',               '',           '222222222-2'),
  ('María García',    'maria@email.com', '3001112222', '900123456-1'),
  ('Juan Pérez',      'juan@email.com',  '3103334444', '900789012-3');

-- Productos
INSERT INTO productos (codigo, nombre, descripcion, categoria_id, proveedor_id, precio_compra, precio_venta, stock, stock_minimo) VALUES
  ('ELEC-001', 'Audífonos Bluetooth', 'Audífonos inalámbricos 40h batería', 1, 1,  45000,  89900, 25, 5),
  ('ELEC-002', 'Cable USB-C 2m',      'Cable de carga rápida 65W',          1, 1,   8000,  18900, 80, 10),
  ('ELEC-003', 'Teclado Mecánico',    'Teclado gaming RGB switches blue',   1, 1, 120000, 229900, 12, 3),
  ('OFIC-001', 'Resma Papel A4',      '500 hojas bond 75g',                 5, 2,  10000,  18500, 60, 10),
  ('OFIC-002', 'Bolígrafos x12',      'Pack 12 bolígrafos negros',          5, 2,   4500,   9900, 100, 20),
  ('HERR-001', 'Destornillador Set',  'Set 32 piezas magnético',            4, 3,  25000,  49900, 18, 4);

-- Empresa config
INSERT INTO empresa_config (clave, valor) VALUES
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
--  VERIFICACIÓN FINAL
-- ─────────────────────────────────────────
SELECT '✅ Base de datos creada correctamente' AS resultado;
SELECT CONCAT('   Tablas: ', COUNT(*)) AS info FROM information_schema.tables WHERE table_schema = 'inventario_pro';
SELECT CONCAT('   Usuarios: ', COUNT(*)) AS info FROM usuarios;
SELECT CONCAT('   Productos: ', COUNT(*)) AS info FROM productos;

-- ============================================================
--  INVENTARIO PRO V5 — migration_v5.sql (MySQL 5.7 compatible)
-- ============================================================

USE inventario_pro;

-- ─────────────────────────────────────────
--  PROCEDIMIENTO AUXILIAR: agrega columna
--  solo si no existe (compatible 5.7)
-- ─────────────────────────────────────────

DROP PROCEDURE IF EXISTS _add_col;
DROP PROCEDURE IF EXISTS _add_fk;

DELIMITER $$

CREATE PROCEDURE _add_col(
  IN p_tabla   VARCHAR(100),
  IN p_columna VARCHAR(100),
  IN p_sql     TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE  TABLE_SCHEMA = DATABASE()
      AND  TABLE_NAME   = p_tabla
      AND  COLUMN_NAME  = p_columna
  ) THEN
    SET @_sql = p_sql;
    PREPARE _s FROM @_sql;
    EXECUTE _s;
    DEALLOCATE PREPARE _s;
  END IF;
END$$

CREATE PROCEDURE _add_fk(
  IN p_tabla      VARCHAR(100),
  IN p_constraint VARCHAR(100),
  IN p_sql        TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE  TABLE_SCHEMA    = DATABASE()
      AND  TABLE_NAME      = p_tabla
      AND  CONSTRAINT_NAME = p_constraint
  ) THEN
    SET @_sql = p_sql;
    PREPARE _s FROM @_sql;
    EXECUTE _s;
    DEALLOCATE PREPARE _s;
  END IF;
END$$

DELIMITER ;

-- ─────────────────────────────────────────
--  FEATURE 1: MULTI-SUCURSAL
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sucursales (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  direccion    TEXT,
  telefono     VARCHAR(30),
  email        VARCHAR(100),
  activo       TINYINT(1) DEFAULT 1,
  es_principal TINYINT(1) DEFAULT 0,
  creado_en    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_sucursales (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  producto_id  INT NOT NULL,
  sucursal_id  INT NOT NULL,
  stock        INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 5,
  UNIQUE KEY uq_prod_suc (producto_id, sucursal_id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)  ON DELETE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE CASCADE
);

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

-- ─────────────────────────────────────────
--  FEATURE 5: CONTROL DE CAJA / TURNOS
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS turnos_caja (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT NOT NULL,
  sucursal_id    INT NULL,
  monto_inicial  DECIMAL(12,2) NOT NULL DEFAULT 0,
  monto_final    DECIMAL(12,2) NULL,
  monto_esperado DECIMAL(12,2) NULL,
  diferencia     DECIMAL(12,2) NULL,
  estado         ENUM('abierto','cerrado') DEFAULT 'abierto',
  notas_cierre   TEXT,
  creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cerrado_en     TIMESTAMP NULL,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE RESTRICT,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  turno_id      INT NOT NULL,
  tipo          ENUM('ingreso','egreso','venta','devolucion') NOT NULL,
  monto         DECIMAL(12,2) NOT NULL,
  descripcion   VARCHAR(300),
  referencia_id INT NULL,
  creado_en     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (turno_id) REFERENCES turnos_caja(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  COLUMNAS NUEVAS EN TABLAS EXISTENTES
-- ─────────────────────────────────────────

CALL _add_col('usuarios', 'sucursal_id',
  'ALTER TABLE usuarios ADD COLUMN sucursal_id INT NULL');

CALL _add_col('ventas', 'sucursal_id',
  'ALTER TABLE ventas ADD COLUMN sucursal_id INT NULL');

CALL _add_col('ventas', 'descuento_id',
  'ALTER TABLE ventas ADD COLUMN descuento_id INT NULL');

CALL _add_col('ventas', 'descuento_codigo',
  'ALTER TABLE ventas ADD COLUMN descuento_codigo VARCHAR(50) NULL');

CALL _add_col('ventas', 'turno_id',
  'ALTER TABLE ventas ADD COLUMN turno_id INT NULL');

-- ─────────────────────────────────────────
--  FOREIGN KEYS
-- ─────────────────────────────────────────

CALL _add_fk('usuarios', 'fk_usuario_sucursal',
  'ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_sucursal
   FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL');

CALL _add_fk('ventas', 'fk_venta_sucursal',
  'ALTER TABLE ventas ADD CONSTRAINT fk_venta_sucursal
   FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL');

CALL _add_fk('ventas', 'fk_venta_descuento',
  'ALTER TABLE ventas ADD CONSTRAINT fk_venta_descuento
   FOREIGN KEY (descuento_id) REFERENCES descuentos(id) ON DELETE SET NULL');

CALL _add_fk('ventas', 'fk_venta_turno',
  'ALTER TABLE ventas ADD CONSTRAINT fk_venta_turno
   FOREIGN KEY (turno_id) REFERENCES turnos_caja(id) ON DELETE SET NULL');

-- Limpieza
DROP PROCEDURE IF EXISTS _add_col;
DROP PROCEDURE IF EXISTS _add_fk;

-- ─────────────────────────────────────────
--  DATOS INICIALES V5
-- ─────────────────────────────────────────

INSERT IGNORE INTO sucursales (id, nombre, direccion, telefono, activo, es_principal)
VALUES (1, 'Sucursal Principal', 'Calle 123 # 45-67', '+57 300 000 0000', 1, 1);

INSERT IGNORE INTO stock_sucursales (producto_id, sucursal_id, stock, stock_minimo)
SELECT id, 1, stock, stock_minimo FROM productos WHERE activo = 1;

UPDATE usuarios SET sucursal_id = 1 WHERE sucursal_id IS NULL;

INSERT IGNORE INTO descuentos (codigo, nombre, tipo, valor, aplica_a, activo, fecha_inicio, fecha_fin) VALUES
  ('BIENVENIDO10', 'Bienvenida 10%',    'porcentaje', 10,   'todos',   1, NULL, NULL),
  ('DESC5K',       'Descuento $5.000',  'monto_fijo', 5000, 'todos',   1, NULL, NULL),
  ('VIP20',        'VIP 20% descuento', 'porcentaje', 20,   'cliente', 0, NULL, NULL);

-- ─────────────────────────────────────────
--  VERIFICACIÓN
-- ─────────────────────────────────────────
SELECT '✅ Migration V5 aplicada correctamente' AS resultado;
SELECT CONCAT('   Sucursales: ',     COUNT(*)) AS info FROM sucursales;
SELECT CONCAT('   Descuentos: ',     COUNT(*)) AS info FROM descuentos;
SELECT CONCAT('   Turnos caja: ',    COUNT(*)) AS info FROM turnos_caja;
SELECT CONCAT('   Stock sucursal: ', COUNT(*)) AS info FROM stock_sucursales;

ALTER TABLE productos MODIFY COLUMN imagen_url TEXT;

CREATE TABLE IF NOT EXISTS auditoria (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT,
  usuario_nombre VARCHAR(100),
  accion         VARCHAR(50)  NOT NULL,
  tabla          VARCHAR(50),
  registro_id    INT,
  detalle        TEXT,
  ip             VARCHAR(45),
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_accion  (accion),
  INDEX idx_usuario (usuario_id),
  INDEX idx_fecha   (creado_en)
);