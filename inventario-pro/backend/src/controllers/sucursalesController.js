// ══════════════════════════════════════════════════════════════
//  sucursalesController.js  ·  V5 – Multi-sucursal
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*,
         (SELECT COUNT(*) FROM usuarios u WHERE u.sucursal_id = s.id AND u.activo=1) AS total_usuarios,
         (SELECT COUNT(*) FROM ventas v WHERE v.sucursal_id = s.id) AS total_ventas
       FROM sucursales s ORDER BY s.es_principal DESC, s.nombre ASC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [[suc]] = await pool.query('SELECT * FROM sucursales WHERE id=?', [req.params.id]);
    if (!suc) return res.status(404).json({ error: 'Sucursal no encontrada' });
    // Stock de la sucursal
    const [stock] = await pool.query(
      `SELECT ss.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM stock_sucursales ss JOIN productos p ON ss.producto_id = p.id
       WHERE ss.sucursal_id=? ORDER BY p.nombre`,
      [req.params.id]
    );
    res.json({ ...suc, stock });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { nombre, direccion, telefono, email } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const [r] = await pool.query(
      'INSERT INTO sucursales (nombre, direccion, telefono, email) VALUES (?,?,?,?)',
      [nombre, direccion||null, telefono||null, email||null]
    );
    const suc_id = r.insertId;
    // Poblar stock inicial con todos los productos en 0
    const [prods] = await pool.query('SELECT id, stock_minimo FROM productos WHERE activo=1');
    if (prods.length) {
      const vals = prods.map(p => [p.id, suc_id, 0, p.stock_minimo]);
      await pool.query('INSERT IGNORE INTO stock_sucursales (producto_id, sucursal_id, stock, stock_minimo) VALUES ?', [vals]);
    }
    res.status(201).json({ id: suc_id, message: 'Sucursal creada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  const { nombre, direccion, telefono, email, activo } = req.body;
  try {
    await pool.query(
      'UPDATE sucursales SET nombre=?, direccion=?, telefono=?, email=?, activo=? WHERE id=?',
      [nombre, direccion||null, telefono||null, email||null, activo??1, req.params.id]
    );
    res.json({ message: 'Sucursal actualizada' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getStock = async (req, res) => {
  try {
    const { sucursal_id } = req.query;
    const sid = sucursal_id || req.user?.sucursal_id || null;
    let q = `SELECT ss.*, p.nombre, p.codigo, p.precio_venta, p.precio_compra, p.imagen_url,
               c.nombre AS categoria_nombre
             FROM stock_sucursales ss
             JOIN productos p ON ss.producto_id = p.id
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE p.activo=1`;
    const params = [];
    if (sid) { q += ' AND ss.sucursal_id=?'; params.push(sid); }
    q += ' ORDER BY p.nombre';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.ajustarStock = async (req, res) => {
  const { producto_id, sucursal_id, cantidad, motivo } = req.body;
  try {
    const [[ss]] = await pool.query(
      'SELECT * FROM stock_sucursales WHERE producto_id=? AND sucursal_id=?',
      [producto_id, sucursal_id]
    );
    if (!ss) return res.status(404).json({ error: 'Stock no encontrado para esa sucursal' });
    const nuevo = ss.stock + parseInt(cantidad);
    if (nuevo < 0) return res.status(400).json({ error: 'Stock no puede ser negativo' });
    await pool.query(
      'UPDATE stock_sucursales SET stock=? WHERE producto_id=? AND sucursal_id=?',
      [nuevo, producto_id, sucursal_id]
    );
    res.json({ message: 'Stock ajustado', stock_nuevo: nuevo });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getConsolidado = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.codigo, p.nombre, p.precio_venta,
         SUM(ss.stock) AS stock_total,
         JSON_ARRAYAGG(JSON_OBJECT('sucursal', s.nombre, 'stock', ss.stock)) AS por_sucursal
       FROM productos p
       JOIN stock_sucursales ss ON p.id = ss.producto_id
       JOIN sucursales s ON ss.sucursal_id = s.id
       WHERE p.activo=1
       GROUP BY p.id ORDER BY p.nombre`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
