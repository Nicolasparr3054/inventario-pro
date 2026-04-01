// ── CLIENTES ─────────────────────────────────────────────────
const { pool } = require('../config/database');

exports.clientesGetAll = async (req, res) => {
  const { search='' } = req.query;
  try {
    let q = 'SELECT * FROM clientes WHERE activo=1';
    const p = [];
    if (search) { q+=' AND (nombre LIKE ? OR email LIKE ? OR nit LIKE ?)'; p.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    q+=' ORDER BY nombre';
    const [rows] = await pool.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.clientesCreate = async (req, res) => {
  const { nombre, email, telefono, direccion, nit } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const [r] = await pool.query('INSERT INTO clientes (nombre,email,telefono,direccion,nit) VALUES (?,?,?,?,?)',
      [nombre, email||'', telefono||'', direccion||'', nit||'']);
    res.status(201).json({ id: r.insertId, message: 'Cliente creado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.clientesUpdate = async (req, res) => {
  const { nombre, email, telefono, direccion, nit } = req.body;
  try {
    await pool.query('UPDATE clientes SET nombre=?,email=?,telefono=?,direccion=?,nit=? WHERE id=?',
      [nombre, email, telefono, direccion, nit, req.params.id]);
    res.json({ message: 'Cliente actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── CATEGORÍAS ────────────────────────────────────────────────
exports.categoriasGetAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.id) AS total_productos
       FROM categorias c LEFT JOIN productos p ON p.categoria_id=c.id AND p.activo=1
       GROUP BY c.id ORDER BY c.nombre`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.categoriasCreate = async (req, res) => {
  const { nombre, descripcion, color } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const [r] = await pool.query('INSERT INTO categorias (nombre,descripcion,color) VALUES (?,?,?)',
      [nombre, descripcion||'', color||'#6366f1']);
    res.status(201).json({ id: r.insertId, message: 'Categoría creada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── PROVEEDORES ───────────────────────────────────────────────
exports.proveedoresGetAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pr.*, COUNT(p.id) AS total_productos
       FROM proveedores pr LEFT JOIN productos p ON p.proveedor_id=pr.id AND p.activo=1
       WHERE pr.activo=1 GROUP BY pr.id ORDER BY pr.nombre`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.proveedoresCreate = async (req, res) => {
  const { nombre, contacto, telefono, email, direccion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const [r] = await pool.query('INSERT INTO proveedores (nombre,contacto,telefono,email,direccion) VALUES (?,?,?,?,?)',
      [nombre, contacto||'', telefono||'', email||'', direccion||'']);
    res.status(201).json({ id: r.insertId, message: 'Proveedor creado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
