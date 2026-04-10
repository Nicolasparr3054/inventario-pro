-- ══════════════════════════════════════════════════════════════
--  migration_v6.sql  ·  V7 – Log de auditoría
-- ══════════════════════════════════════════════════════════════

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

SELECT 'migration_v6.sql aplicada correctamente ✅' AS resultado;
