-- ============================================================
--  INVENTARIO PRO V5 — Script COMPLETO (instala todo desde cero)
--  Ejecuta ESTE ARCHIVO para instalación limpia.
--  Para actualizar desde V4 usa: migration_v5.sql
-- ============================================================

SOURCE database_completo_v4.sql;
SOURCE migration_v5.sql;

SELECT '✅ Inventario Pro V5 instalado correctamente' AS resultado;
