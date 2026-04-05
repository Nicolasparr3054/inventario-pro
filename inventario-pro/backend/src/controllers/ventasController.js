const { pool } = require('../config/database');

const genNumero = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `VTA-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${Math.floor(1000+Math.random()*9000)}`;
};

exports.getAll = async (req, res) => {
  try {
    const { desde, hasta, estado } = req.query;
    let q = `SELECT v.*, c.nombre AS cliente_nombre, u.nombre AS vendedor_nombre,
               (SELECT COUNT(*) FROM venta_detalles WHERE venta_id=v.id) AS total_items
             FROM ventas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE 1=1`;
    const p = [];
    if (desde)  { q+=' AND DATE(v.creado_en)>=?'; p.push(desde); }
    if (hasta)  { q+=' AND DATE(v.creado_en)<=?'; p.push(hasta); }
    if (estado) { q+=' AND v.estado=?'; p.push(estado); }
    if (req.user?.rol === 'cajero') { q+=' AND v.usuario_id=?'; p.push(req.user.id); }
    q += ' ORDER BY v.creado_en DESC LIMIT 200';
    const [rows] = await pool.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [[venta]] = await pool.query(
      `SELECT v.*, c.nombre AS cliente_nombre, c.nit AS cliente_nit, c.telefono AS cliente_tel,
              u.nombre AS vendedor_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id=?`, [req.params.id]
    );
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    const [detalles] = await pool.query(
      `SELECT vd.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM venta_detalles vd JOIN productos p ON vd.producto_id=p.id
       WHERE vd.venta_id=?`, [req.params.id]
    );
    res.json({ ...venta, detalles });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { cliente_id, items, metodo_pago, descuento=0, notas, impuesto_pct=0 } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Sin productos' });
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    for (const item of items) {
      const [[p]] = await conn.query('SELECT stock,nombre FROM productos WHERE id=? AND activo=1', [item.producto_id]);
      if (!p) throw new Error(`Producto ${item.producto_id} no encontrado`);
      if (p.stock < item.cantidad) throw new Error(`Stock insuficiente: ${p.nombre}`);
    }
    const subtotal = items.reduce((s, i) => s + i.precio_unit * i.cantidad, 0);
    const impuesto = subtotal * impuesto_pct / 100;
    const total    = subtotal + impuesto - descuento;
    const numero   = genNumero();
    const [r] = await conn.query(
      `INSERT INTO ventas (numero_venta,cliente_id,subtotal,impuesto,descuento,total,metodo_pago,notas,usuario_id)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [numero, cliente_id||null, subtotal, impuesto, descuento, total, metodo_pago||'efectivo', notas||null, req.user?.id||null]
    );
    const venta_id = r.insertId;
    for (const item of items) {
      await conn.query(
        `INSERT INTO venta_detalles (venta_id,producto_id,cantidad,precio_unit,subtotal) VALUES (?,?,?,?,?)`,
        [venta_id, item.producto_id, item.cantidad, item.precio_unit, item.precio_unit*item.cantidad]
      );
    }
    await conn.commit();
    res.status(201).json({ id: venta_id, numero_venta: numero, total, message: 'Venta registrada' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally { conn.release(); }
};

// Datos para recibo de pantalla
exports.getRecibo = async (req, res) => {
  try {
    const empresa = await getEmpresaSimple();
    const [[venta]] = await pool.query(
      `SELECT v.*, c.nombre AS cliente_nombre, c.nit AS cliente_nit, c.telefono AS cliente_tel,
              u.nombre AS vendedor_nombre
       FROM ventas v
       LEFT JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON v.usuario_id = u.id
       WHERE v.id=?`, [req.params.id]
    );
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    const [detalles] = await pool.query(
      `SELECT vd.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM venta_detalles vd JOIN productos p ON vd.producto_id=p.id
       WHERE vd.venta_id=?`, [req.params.id]
    );
    res.json({ ...venta, detalles, empresa: empresa.nombre || 'Inventario Pro' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

async function getEmpresaSimple() {
  try {
    const [rows] = await pool.query('SELECT clave, valor FROM empresa_config');
    return Object.fromEntries(rows.map(r => [r.clave, r.valor]));
  } catch { return {}; }
}
