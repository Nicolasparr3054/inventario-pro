const { pool } = require('../config/database');
const bcrypt   = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, email, rol, activo, creado_en FROM usuarios ORDER BY nombre`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol) VALUES (?,?,?,?)`,
      [nombre, email, hash, rol || 'cajero']
    );
    res.status(201).json({ id: r.insertId, message: 'Usuario creado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { nombre, email, rol, activo, password } = req.body;
  const id = req.params.id;
  if (Number(id) === req.user.id && activo === 0)
    return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE usuarios SET nombre=?, email=?, rol=?, activo=?, password=? WHERE id=?`,
        [nombre, email, rol, activo ?? 1, hash, id]
      );
    } else {
      await pool.query(
        `UPDATE usuarios SET nombre=?, email=?, rol=?, activo=? WHERE id=?`,
        [nombre, email, rol, activo ?? 1, id]
      );
    }
    res.json({ message: 'Usuario actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  const id = req.params.id;
  if (Number(id) === req.user.id)
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  try {
    await pool.query(`UPDATE usuarios SET activo=0 WHERE id=?`, [id]);
    res.json({ message: 'Usuario desactivado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// V3: historial de accesos
exports.getAccesos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.nombre AS usuario_nombre
       FROM accesos_log a
       LEFT JOIN usuarios u ON a.usuario_id = u.id
       ORDER BY a.creado_en DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};