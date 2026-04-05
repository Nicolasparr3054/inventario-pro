// ══════════════════════════════════════════════════════════════
//  ordenesCompraController.js  ·  V4 – Órdenes de compra
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

const genNumero = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `OC-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// GET /ordenes-compra
exports.getAll = async (req, res) => {
  try {
    const { estado, proveedor_id } = req.query;
    let q = `SELECT oc.*, pr.nombre AS proveedor_nombre, u.nombre AS usuario_nombre,
               (SELECT COUNT(*) FROM orden_compra_detalles WHERE orden_id=oc.id) AS total_items
             FROM ordenes_compra oc
             JOIN proveedores pr ON oc.proveedor_id = pr.id
             LEFT JOIN usuarios u ON oc.usuario_id = u.id
             WHERE 1=1`;
    const p = [];
    if (estado)       { q += ' AND oc.estado=?';        p.push(estado); }
    if (proveedor_id) { q += ' AND oc.proveedor_id=?';  p.push(proveedor_id); }
    q += ' ORDER BY oc.creado_en DESC LIMIT 200';
    const [rows] = await pool.query(q, p);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /ordenes-compra/:id
exports.getOne = async (req, res) => {
  try {
    const [[orden]] = await pool.query(
      `SELECT oc.*, pr.nombre AS proveedor_nombre, pr.email AS proveedor_email,
              pr.telefono AS proveedor_tel, u.nombre AS usuario_nombre
       FROM ordenes_compra oc
       JOIN proveedores pr ON oc.proveedor_id = pr.id
       LEFT JOIN usuarios u ON oc.usuario_id = u.id
       WHERE oc.id=?`, [req.params.id]
    );
    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    const [detalles] = await pool.query(
      `SELECT ocd.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM orden_compra_detalles ocd
       JOIN productos p ON ocd.producto_id = p.id
       WHERE ocd.orden_id=?`, [req.params.id]
    );
    res.json({ ...orden, detalles });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /ordenes-compra
// Body: { proveedor_id, items:[{producto_id, cantidad, precio_unit}], notas, fecha_entrega }
exports.create = async (req, res) => {
  const { proveedor_id, items, notas, fecha_entrega } = req.body;
  if (!proveedor_id || !items?.length) {
    return res.status(400).json({ error: 'proveedor_id e items son requeridos' });
  }
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const subtotal = items.reduce((s, i) => s + i.cantidad * i.precio_unit, 0);
    const numero = genNumero();

    const [r] = await conn.query(
      `INSERT INTO ordenes_compra (numero, proveedor_id, subtotal, total, notas, fecha_entrega, usuario_id)
       VALUES (?,?,?,?,?,?,?)`,
      [numero, proveedor_id, subtotal, subtotal, notas || null, fecha_entrega || null, req.user?.id || null]
    );
    const orden_id = r.insertId;

    for (const item of items) {
      await conn.query(
        `INSERT INTO orden_compra_detalles (orden_id, producto_id, cantidad, precio_unit, subtotal)
         VALUES (?,?,?,?,?)`,
        [orden_id, item.producto_id, item.cantidad, item.precio_unit, item.cantidad * item.precio_unit]
      );
    }
    await conn.commit();
    res.status(201).json({ id: orden_id, numero, total: subtotal, message: 'Orden creada' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally { conn.release(); }
};

// PATCH /ordenes-compra/:id/estado
// Body: { estado } — 'borrador' | 'enviada' | 'recibida' | 'cancelada'
exports.cambiarEstado = async (req, res) => {
  const { estado } = req.body;
  const id = req.params.id;
  const validos = ['borrador', 'enviada', 'recibida', 'cancelada'];
  if (!validos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [[orden]] = await conn.query('SELECT * FROM ordenes_compra WHERE id=?', [id]);
    if (!orden) throw new Error('Orden no encontrada');

    await conn.query('UPDATE ordenes_compra SET estado=? WHERE id=?', [estado, id]);

    // Si se marca como recibida → ingresar stock
    if (estado === 'recibida' && orden.estado !== 'recibida') {
      const [detalles] = await conn.query(
        'SELECT * FROM orden_compra_detalles WHERE orden_id=?', [id]
      );
      for (const det of detalles) {
        const [[prod]] = await conn.query('SELECT stock FROM productos WHERE id=?', [det.producto_id]);
        if (!prod) continue;
        const stockNuevo = prod.stock + det.cantidad;
        await conn.query('UPDATE productos SET stock=? WHERE id=?', [stockNuevo, det.producto_id]);
        await conn.query(
          `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
           VALUES (?, 'entrada', ?, ?, ?, ?)`,
          [det.producto_id, det.cantidad, prod.stock, stockNuevo, `Orden de compra ${orden.numero}`]
        );
        await conn.query(
          'UPDATE orden_compra_detalles SET cantidad_recibida=cantidad WHERE orden_id=?', [id]
        );
      }
    }

    await conn.commit();
    res.json({ message: `Orden marcada como ${estado}` });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally { conn.release(); }
};

// PUT /ordenes-compra/:id
exports.update = async (req, res) => {
  const { items, notas, fecha_entrega, proveedor_id } = req.body;
  const id = req.params.id;
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    const [[orden]] = await conn.query('SELECT estado FROM ordenes_compra WHERE id=?', [id]);
    if (!orden) throw new Error('Orden no encontrada');
    if (orden.estado !== 'borrador') throw new Error('Solo se pueden editar órdenes en borrador');

    const subtotal = items.reduce((s, i) => s + i.cantidad * i.precio_unit, 0);
    await conn.query(
      'UPDATE ordenes_compra SET proveedor_id=?, subtotal=?, total=?, notas=?, fecha_entrega=? WHERE id=?',
      [proveedor_id, subtotal, subtotal, notas || null, fecha_entrega || null, id]
    );
    await conn.query('DELETE FROM orden_compra_detalles WHERE orden_id=?', [id]);
    for (const item of items) {
      await conn.query(
        `INSERT INTO orden_compra_detalles (orden_id, producto_id, cantidad, precio_unit, subtotal)
         VALUES (?,?,?,?,?)`,
        [id, item.producto_id, item.cantidad, item.precio_unit, item.cantidad * item.precio_unit]
      );
    }
    await conn.commit();
    res.json({ message: 'Orden actualizada' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally { conn.release(); }
};