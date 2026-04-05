-- ============================================================
--  INVENTARIO PRO V3 — Migración
--  Ejecutar DESPUÉS de migration_v2.sql
-- ============================================================

USE inventario_pro;

-- ─────────────────────────────────────────
-- 1. Imagen en productos (URL o base64)
-- ─────────────────────────────────────────
ALTER TABLE productos MODIFY COLUMN imagen_url VARCHAR(1000);

-- ─────────────────────────────────────────
-- 2. Códigos de barras por producto
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS codigos_barras (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  codigo      VARCHAR(100) NOT NULL UNIQUE,
  creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- 3. Log de accesos al sistema
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accesos_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  email      VARCHAR(100),
  accion     ENUM('login','logout','login_fallido') NOT NULL,
  ip         VARCHAR(50),
  creado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- 4. Recibos de venta (para impresión)
-- ─────────────────────────────────────────
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS notas_recibo TEXT,
  ADD COLUMN IF NOT EXISTS impreso TINYINT(1) DEFAULT 0;
