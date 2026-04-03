const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/database');

const logAcceso = async (usuario_id, email, accion, req) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    await pool.query(
      `INSERT INTO accesos_log (usuario_id, email, accion, ip) VALUES (?,?,?,?)`,
      [usuario_id || null, email || null, accion, ip]
    );
  } catch { /* no bloquear si falla el log */ }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ? AND activo = 1', [email]
    );
    if (!rows.length) {
      await logAcceso(null, email, 'login_fallido', req);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await logAcceso(user.id, email, 'login_fallido', req);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    await logAcceso(user.id, email, 'login', req);
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );
    res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.logout = async (req, res) => {
  await logAcceso(req.user?.id, req.user?.email, 'logout', req);
  res.json({ message: 'Sesión cerrada' });
};