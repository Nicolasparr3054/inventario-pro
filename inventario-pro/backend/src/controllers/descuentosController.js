// ══════════════════════════════════════════════════════════════
//  descuentosController.js  ·  V5 – Descuentos y promociones
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*,
         CASE WHEN d.activo=1
              AND (d.fecha_inicio IS NULL OR d.fecha_inicio <= CURDATE())
              AND (d.fecha_fin IS NULL OR d.fecha_fin >= CURDATE())
              AND (d.uso_maximo IS NULL OR d.usos < d.uso_maximo)
           THEN 1 ELSE 0 END AS vigente
       FROM descuentos d ORDER BY d.creado_en DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [[d]] = await pool.query('SELECT * FROM descuentos WHERE id=?', [req.params.id]);
    if (!d) return res.status(404).json({ error: 'Descuento no encontrado' });
    res.json(d);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.buscarPorCodigo = async (req, res) => {
  const { codigo } = req.query;
  if (!codigo) return res.status(400).json({ error: 'Código requerido' });
  try {
    const [[d]] = await pool.query(
      `SELECT * FROM descuentos WHERE codigo=? AND activo=1
         AND (fecha_inicio IS NULL OR fecha_inicio <= CURDATE())
         AND (fecha_fin IS NULL OR fecha_fin >= CURDATE())
         AND (uso_maximo IS NULL OR usos < uso_maximo)`,
      [codigo.toUpperCase()]
    );
    if (!d) return res.status(404).json({ error: 'Descuento no válido o expirado' });
    res.json(d);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { codigo, nombre, tipo, valor, aplica_a, referencia_id, activo, fecha_inicio, fecha_fin, uso_maximo } = req.body;
  if (!codigo || !nombre || !tipo || valor == null) {
    return res.status(400).json({ error: 'Código, nombre, tipo y valor son requeridos' });
  }
  try {
    const [r] = await pool.query(
      `INSERT INTO descuentos (codigo, nombre, tipo, valor, aplica_a, referencia_id, activo, fecha_inicio, fecha_fin, uso_maximo)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [codigo.toUpperCase(), nombre, tipo, valor, aplica_a||'todos', referencia_id||null,
       activo??1, fecha_inicio||null, fecha_fin||null, uso_maximo||null]
    );
    res.status(201).json({ id: r.insertId, message: 'Descuento creado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El código ya existe' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { codigo, nombre, tipo, valor, aplica_a, referencia_id, activo, fecha_inicio, fecha_fin, uso_maximo } = req.body;
  try {
    await pool.query(
      `UPDATE descuentos SET codigo=?, nombre=?, tipo=?, valor=?, aplica_a=?,
         referencia_id=?, activo=?, fecha_inicio=?, fecha_fin=?, uso_maximo=?
       WHERE id=?`,
      [codigo.toUpperCase(), nombre, tipo, valor, aplica_a||'todos', referencia_id||null,
       activo??1, fecha_inicio||null, fecha_fin||null, uso_maximo||null, req.params.id]
    );
    res.json({ message: 'Descuento actualizado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El código ya existe' });
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('UPDATE descuentos SET activo=0 WHERE id=?', [req.params.id]);
    res.json({ message: 'Descuento desactivado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
