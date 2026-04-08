// ══════════════════════════════════════════════════════════════
//  cajaController.js  ·  V5 – Control de caja / turnos
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

// ── Turnos ───────────────────────────────────────────────────

exports.getTurnos = async (req, res) => {
  try {
    const { estado, sucursal_id, limite = 50 } = req.query;
    let q = `SELECT t.*, u.nombre AS usuario_nombre, s.nombre AS sucursal_nombre,
               (SELECT SUM(monto) FROM movimientos_caja WHERE turno_id=t.id AND tipo='venta') AS total_ventas,
               (SELECT SUM(monto) FROM movimientos_caja WHERE turno_id=t.id AND tipo='ingreso') AS total_ingresos,
               (SELECT SUM(monto) FROM movimientos_caja WHERE turno_id=t.id AND tipo='egreso') AS total_egresos,
               (SELECT COUNT(*) FROM movimientos_caja WHERE turno_id=t.id) AS num_movimientos
             FROM turnos_caja t
             LEFT JOIN usuarios u ON t.usuario_id = u.id
             LEFT JOIN sucursales s ON t.sucursal_id = s.id
             WHERE 1=1`;
    const p = [];
    if (estado)      { q += ' AND t.estado=?'; p.push(estado); }
    if (sucursal_id) { q += ' AND t.sucursal_id=?'; p.push(sucursal_id); }
    // Cajero solo ve sus propios turnos
    if (req.user?.rol === 'cajero') { q += ' AND t.usuario_id=?'; p.push(req.user.id); }
    q += ` ORDER BY t.creado_en DESC LIMIT ?`;
    p.push(parseInt(limite));
    const [rows] = await pool.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getTurnoActivo = async (req, res) => {
  try {
    const usuario_id = req.query.usuario_id || req.user.id;
    const [[turno]] = await pool.query(
      `SELECT t.*, u.nombre AS usuario_nombre, s.nombre AS sucursal_nombre
       FROM turnos_caja t
       LEFT JOIN usuarios u ON t.usuario_id=u.id
       LEFT JOIN sucursales s ON t.sucursal_id=s.id
       WHERE t.estado='abierto' AND t.usuario_id=?
       ORDER BY t.creado_en DESC LIMIT 1`,
      [usuario_id]
    );
    if (!turno) return res.json(null);
    // Movimientos del turno
    const [movs] = await pool.query(
      `SELECT * FROM movimientos_caja WHERE turno_id=? ORDER BY creado_en DESC`,
      [turno.id]
    );
    res.json({ ...turno, movimientos: movs });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.abrirTurno = async (req, res) => {
  const { monto_inicial, sucursal_id } = req.body;
  if (monto_inicial == null || monto_inicial < 0) {
    return res.status(400).json({ error: 'Monto inicial requerido (≥ 0)' });
  }
  try {
    // Verificar que no haya turno abierto
    const [[existe]] = await pool.query(
      'SELECT id FROM turnos_caja WHERE usuario_id=? AND estado=?',
      [req.user.id, 'abierto']
    );
    if (existe) return res.status(400).json({ error: 'Ya tienes un turno abierto' });

    const suc = sucursal_id || req.user.sucursal_id || null;
    const [r] = await pool.query(
      'INSERT INTO turnos_caja (usuario_id, sucursal_id, monto_inicial, estado) VALUES (?,?,?,?)',
      [req.user.id, suc, monto_inicial, 'abierto']
    );
    const turno_id = r.insertId;
    // Movimiento inicial
    await pool.query(
      `INSERT INTO movimientos_caja (turno_id, tipo, monto, descripcion) VALUES (?,?,?,?)`,
      [turno_id, 'ingreso', monto_inicial, 'Apertura de caja']
    );
    res.status(201).json({ id: turno_id, message: 'Turno abierto' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.cerrarTurno = async (req, res) => {
  const { monto_final, notas_cierre } = req.body;
  const turno_id = req.params.id;
  if (monto_final == null) return res.status(400).json({ error: 'Monto final requerido' });
  try {
    const [[turno]] = await pool.query('SELECT * FROM turnos_caja WHERE id=?', [turno_id]);
    if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
    if (turno.estado !== 'abierto') return res.status(400).json({ error: 'El turno ya está cerrado' });
    if (req.user.rol !== 'admin' && turno.usuario_id !== req.user.id) {
      return res.status(403).json({ error: 'No puedes cerrar este turno' });
    }
    // Calcular monto esperado
    const [[resumen]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo IN ('ingreso','venta') THEN monto ELSE 0 END),0) -
         COALESCE(SUM(CASE WHEN tipo IN ('egreso','devolucion') THEN monto ELSE 0 END),0)
         AS esperado
       FROM movimientos_caja WHERE turno_id=?`,
      [turno_id]
    );
    const monto_esperado = parseFloat(resumen.esperado || 0);
    const diferencia = parseFloat(monto_final) - monto_esperado;
    await pool.query(
      `UPDATE turnos_caja SET estado='cerrado', monto_final=?, monto_esperado=?,
         diferencia=?, notas_cierre=?, cerrado_en=NOW() WHERE id=?`,
      [monto_final, monto_esperado, diferencia, notas_cierre||null, turno_id]
    );
    res.json({ message: 'Turno cerrado', monto_esperado, diferencia });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Movimientos ──────────────────────────────────────────────

exports.getMovimientos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM movimientos_caja WHERE turno_id=? ORDER BY creado_en DESC',
      [req.params.turno_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.addMovimiento = async (req, res) => {
  const { tipo, monto, descripcion } = req.body;
  const turno_id = req.params.turno_id;
  if (!tipo || !monto) return res.status(400).json({ error: 'Tipo y monto requeridos' });
  try {
    const [[turno]] = await pool.query('SELECT * FROM turnos_caja WHERE id=? AND estado=?', [turno_id, 'abierto']);
    if (!turno) return res.status(400).json({ error: 'Turno no encontrado o cerrado' });
    const [r] = await pool.query(
      'INSERT INTO movimientos_caja (turno_id, tipo, monto, descripcion) VALUES (?,?,?,?)',
      [turno_id, tipo, parseFloat(monto), descripcion||null]
    );
    res.status(201).json({ id: r.insertId, message: 'Movimiento registrado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getResumenTurno = async (req, res) => {
  try {
    const [[turno]] = await pool.query(
      `SELECT t.*, u.nombre AS usuario_nombre, s.nombre AS sucursal_nombre
       FROM turnos_caja t
       LEFT JOIN usuarios u ON t.usuario_id=u.id
       LEFT JOIN sucursales s ON t.sucursal_id=s.id
       WHERE t.id=?`, [req.params.id]
    );
    if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });
    const [movs] = await pool.query(
      'SELECT * FROM movimientos_caja WHERE turno_id=? ORDER BY creado_en ASC',
      [req.params.id]
    );
    const resumen = {
      total_ventas:    movs.filter(m => m.tipo === 'venta').reduce((s, m) => s + parseFloat(m.monto), 0),
      total_ingresos:  movs.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + parseFloat(m.monto), 0),
      total_egresos:   movs.filter(m => m.tipo === 'egreso').reduce((s, m) => s + parseFloat(m.monto), 0),
      total_devoluc:   movs.filter(m => m.tipo === 'devolucion').reduce((s, m) => s + parseFloat(m.monto), 0),
    };
    res.json({ ...turno, movimientos: movs, resumen });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
