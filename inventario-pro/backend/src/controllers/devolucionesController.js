// ══════════════════════════════════════════════════════════════
//  devolucionesController.js  ·  V4 – Devoluciones de ventas
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

const genNumero = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `DEV-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// GET /devoluciones
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT d.*, v.numero_venta, c.nombre AS cliente_nombre, u.nombre AS usuario_nombre
       FROM devoluciones d
       JOIN ventas v ON d.venta_id = v.id
       LEFT JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       ORDER BY d.creado_en DESC LIMIT 200`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /devoluciones/:id
exports.getOne = async (req, res) => {
  try {
    const [[dev]] = await pool.query(
      `SELECT d.*, v.numero_venta, c.nombre AS cliente_nombre, c.telefono AS cliente_tel,
              u.nombre AS usuario_nombre
       FROM devoluciones d
       JOIN ventas v ON d.venta_id = v.id
       LEFT JOIN clientes c ON v.cliente_id = c.id
       LEFT JOIN usuarios u ON d.usuario_id = u.id
       WHERE d.id = ?`, [req.params.id]
    );
    if (!dev) return res.status(404).json({ error: 'Devolución no encontrada' });

    const [detalles] = await pool.query(
      `SELECT dd.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM devolucion_detalles dd
       JOIN productos p ON dd.producto_id = p.id
       WHERE dd.devolucion_id = ?`, [req.params.id]
    );
    res.json({ ...dev, detalles });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /devoluciones
// Body: { venta_id, items: [{producto_id, cantidad}], motivo }
exports.create = async (req, res) => {
  const { venta_id, items, motivo } = req.body;
  if (!venta_id || !items?.length) {
    return res.status(400).json({ error: 'venta_id e items son requeridos' });
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    // Verificar que la venta existe y no está ya completamente devuelta
    const [[venta]] = await conn.query('SELECT * FROM ventas WHERE id=?', [venta_id]);
    if (!venta) throw new Error('Venta no encontrada');
    if (venta.estado === 'cancelada') throw new Error('No se puede devolver una venta cancelada');

    // Verificar detalles originales y calcular totales
    const [detallesOriginales] = await conn.query(
      'SELECT * FROM venta_detalles WHERE venta_id=?', [venta_id]
    );

    // Verificar cantidades ya devueltas
    const [yaDevueltas] = await conn.query(
      `SELECT dd.producto_id, SUM(dd.cantidad) AS cant_devuelta
       FROM devolucion_detalles dd
       JOIN devoluciones d ON dd.devolucion_id = d.id
       WHERE d.venta_id = ? AND d.estado != 'rechazada'
       GROUP BY dd.producto_id`, [venta_id]
    );
    const devMap = {};
    yaDevueltas.forEach(r => { devMap[r.producto_id] = Number(r.cant_devuelta); });

    let totalDevuelto = 0;
    const detallesDevolucion = [];

    for (const item of items) {
      const original = detallesOriginales.find(d => d.producto_id === item.producto_id);
      if (!original) throw new Error(`Producto ${item.producto_id} no está en la venta original`);

      const yaDevuelto = devMap[item.producto_id] || 0;
      const disponible = original.cantidad - yaDevuelto;
      if (item.cantidad > disponible) {
        throw new Error(`Solo se pueden devolver ${disponible} unidades del producto ${item.producto_id}`);
      }

      const subtotal = item.cantidad * Number(original.precio_unit);
      totalDevuelto += subtotal;
      detallesDevolucion.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unit: original.precio_unit,
        subtotal,
      });
    }

    // Crear la devolución
    const numero = genNumero();
    const [r] = await conn.query(
      `INSERT INTO devoluciones (venta_id, numero, motivo, total_devuelto, estado, usuario_id)
       VALUES (?, ?, ?, ?, 'aprobada', ?)`,
      [venta_id, numero, motivo || null, totalDevuelto, req.user?.id || null]
    );
    const devolucion_id = r.insertId;

    // Insertar detalles y restaurar stock
    for (const det of detallesDevolucion) {
      await conn.query(
        `INSERT INTO devolucion_detalles (devolucion_id, producto_id, cantidad, precio_unit, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [devolucion_id, det.producto_id, det.cantidad, det.precio_unit, det.subtotal]
      );

      // Restituir stock
      const [[prod]] = await conn.query('SELECT stock FROM productos WHERE id=?', [det.producto_id]);
      const stockNuevo = prod.stock + det.cantidad;
      await conn.query('UPDATE productos SET stock=? WHERE id=?', [stockNuevo, det.producto_id]);
      await conn.query(
        `INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
         VALUES (?, 'entrada', ?, ?, ?, ?)`,
        [det.producto_id, det.cantidad, prod.stock, stockNuevo, `Devolución ${numero}`]
      );
    }

    // Marcar la venta como con devolución
    await conn.query('UPDATE ventas SET tiene_devolucion=1 WHERE id=?', [venta_id]);

    // Auto-registrar movimiento de devolución en caja si hay turno activo
    try {
      const [[turnoActivo]] = await conn.query(
        `SELECT id FROM turnos_caja WHERE usuario_id=? AND estado='abierto' ORDER BY creado_en DESC LIMIT 1`,
        [req.user?.id || null]
      );
      if (turnoActivo) {
        await conn.query(
          `INSERT INTO movimientos_caja (turno_id, tipo, monto, descripcion) VALUES (?,?,?,?)`,
          [turnoActivo.id, 'devolucion', totalDevuelto, `Devolución ${numero} - Venta ${venta.numero_venta}`]
        );
      }
    } catch (cajaErr) {
      console.error('[Caja] Error al registrar devolución:', cajaErr.message);
    }

    // Crear notificación
    await conn.query(
      `INSERT INTO notificaciones (tipo, titulo, mensaje, referencia_id, referencia_tipo)
       VALUES ('devolucion', 'Nueva devolución registrada', ?, ?, 'devolucion')`,
      [`Devolución ${numero} por $${totalDevuelto.toLocaleString('es-CO')} de la venta ${venta.numero_venta}`, devolucion_id]
    );

    await conn.commit();
    res.status(201).json({ id: devolucion_id, numero, total_devuelto: totalDevuelto, message: 'Devolución registrada' });
  } catch (err) {
    await conn.rollback();
    res.status(400).json({ error: err.message });
  } finally { conn.release(); }
};