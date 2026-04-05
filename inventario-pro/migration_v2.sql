-- ============================================================
--  INVENTARIO PRO V2 — Migración
--  Ejecutar DESPUÉS del database.sql original
-- ============================================================

USE inventario_pro;

-- ─────────────────────────────────────────
-- 1. Roles en usuarios: agregar 'cajero'
-- ─────────────────────────────────────────
ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('admin','cajero','vendedor','almacenista') DEFAULT 'cajero';

-- Agregar usuario cajero de prueba (password: password)
INSERT IGNORE INTO usuarios (nombre, email, password, rol) VALUES
  ('Cajero Demo', 'cajero@inventariopro.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cajero');

-- ─────────────────────────────────────────
-- 2. Historial de precios
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historial_precios (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  producto_id     INT NOT NULL,
  precio_compra_anterior DECIMAL(12,2),
  precio_venta_anterior  DECIMAL(12,2),
  precio_compra_nuevo    DECIMAL(12,2),
  precio_venta_nuevo     DECIMAL(12,2),
  usuario_id      INT,
  creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id)  ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- 3. Campos adicionales
-- ─────────────────────────────────────────
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS alerta_stock TINYINT(1) DEFAULT 1;

ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS usuario_id INT,
  ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
