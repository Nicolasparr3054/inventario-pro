// ══════════════════════════════════════════════════════════════
//  auditoriaController.js  ·  V7 – Log de auditoría
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

// ─── Helper utilitario (no es ruta) ──────────────────────────
const registrar = async (poolConn, usuario, accion, tabla, registroId, detalle, ip) => {
  try {
    await poolConn.query(
      `INSERT INTO auditoria (usuario_id, usuario_nombre, accion, tabla, registro_id, detalle, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario?.id     || null,
        usuario?.nombre || 'Sistema',
        accion,
        tabla      || null,
        registroId || null,
        detalle    || null,
        ip         || null,
      ]
    );
  } catch (err) {
    console.error('[Auditoría] Error al registrar:', err.message);
  }
};

module.exports.registrar = registrar;

// ─── GET /auditoria/stats ─────────────────────────────────────
module.exports.getStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT accion, COUNT(*) AS total
       FROM auditoria
       WHERE creado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY accion
       ORDER BY total DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── GET /auditoria ───────────────────────────────────────────
module.exports.getAll = async (req, res) => {
  try {
    const { accion, desde } = req.query;
    let q = `SELECT * FROM auditoria WHERE 1=1`;
    const params = [];

    if (accion) { q += ` AND accion = ?`;     params.push(accion); }
    if (desde)  { q += ` AND creado_en >= ?`; params.push(desde); }

    q += ` ORDER BY creado_en DESC LIMIT 200`;

    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};