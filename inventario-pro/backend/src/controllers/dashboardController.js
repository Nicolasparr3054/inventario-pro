const { pool } = require('../config/database');

exports.getStats = async (req, res) => {
  const usuarioId = req.user?.id;
  const esCajero  = req.user?.rol === 'cajero';

  try {
    if (esCajero) {
      // ── Vista cajero: solo sus propias ventas ─────────────────────────
      const [[ventasHoy]] = await pool.query(
        `SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad
         FROM ventas WHERE DATE(creado_en)=CURDATE() AND estado='completada' AND usuario_id=?`,
        [usuarioId]
      );
      const [[ventasMes]] = await pool.query(
        `SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad
         FROM ventas WHERE MONTH(creado_en)=MONTH(CURDATE()) AND YEAR(creado_en)=YEAR(CURDATE())
           AND estado='completada' AND usuario_id=?`,
        [usuarioId]
      );
      const [ultimasVentas] = await pool.query(
        `SELECT v.numero_venta, v.total, v.metodo_pago, v.creado_en,
                c.nombre AS cliente_nombre,
                (SELECT COUNT(*) FROM venta_detalles WHERE venta_id=v.id) AS total_items
         FROM ventas v LEFT JOIN clientes c ON v.cliente_id=c.id
         WHERE v.usuario_id=? AND v.estado='completada'
         ORDER BY v.creado_en DESC LIMIT 5`,
        [usuarioId]
      );
      return res.json({ esCajero: true, ventasHoy, ventasMes, ultimasVentas });
    }

    // ── Vista admin: datos globales ───────────────────────────────────
    const [[ventasHoy]]      = await pool.query(`SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad FROM ventas WHERE DATE(creado_en)=CURDATE() AND estado='completada'`);
    const [[ventasMes]]      = await pool.query(`SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad FROM ventas WHERE MONTH(creado_en)=MONTH(CURDATE()) AND YEAR(creado_en)=YEAR(CURDATE()) AND estado='completada'`);
    const [[ventasMesAnt]]   = await pool.query(`SELECT COALESCE(SUM(total),0) AS total FROM ventas WHERE MONTH(creado_en)=MONTH(DATE_SUB(CURDATE(),INTERVAL 1 MONTH)) AND YEAR(creado_en)=YEAR(DATE_SUB(CURDATE(),INTERVAL 1 MONTH)) AND estado='completada'`);
    const [[totalProductos]] = await pool.query(`SELECT COUNT(*) AS total FROM productos WHERE activo=1`);
    const [[stockBajo]]      = await pool.query(`SELECT COUNT(*) AS total FROM productos WHERE stock<=stock_minimo AND activo=1`);
    const [[stockAgotado]]   = await pool.query(`SELECT COUNT(*) AS total FROM productos WHERE stock=0 AND activo=1`);

    const varMes = ventasMesAnt.total > 0
      ? Math.round(((ventasMes.total - ventasMesAnt.total) / ventasMesAnt.total) * 100)
      : null;

    const [ventasSemana] = await pool.query(`
      SELECT DATE(creado_en) AS fecha, COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad
      FROM ventas WHERE creado_en >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND estado='completada'
      GROUP BY DATE(creado_en) ORDER BY fecha`);

    const [topProductos] = await pool.query(`
      SELECT p.nombre, SUM(vd.cantidad) AS vendidos, SUM(vd.subtotal) AS ingresos
      FROM venta_detalles vd JOIN productos p ON vd.producto_id=p.id JOIN ventas v ON vd.venta_id=v.id
      WHERE v.estado='completada' AND v.creado_en >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY p.id ORDER BY vendidos DESC LIMIT 5`);

    const [porMetodo] = await pool.query(`
      SELECT metodo_pago, COUNT(*) AS cantidad, SUM(total) AS total
      FROM ventas WHERE MONTH(creado_en)=MONTH(CURDATE()) AND YEAR(creado_en)=YEAR(CURDATE()) AND estado='completada'
      GROUP BY metodo_pago`);

    const [movimientos] = await pool.query(`
      SELECT m.*, p.nombre AS producto_nombre, p.codigo
      FROM movimientos_inventario m JOIN productos p ON m.producto_id=p.id
      ORDER BY m.creado_en DESC LIMIT 10`);

    const [alertasStock] = await pool.query(`
      SELECT p.id, p.nombre, p.codigo, p.stock, p.stock_minimo, c.nombre AS categoria_nombre
      FROM productos p LEFT JOIN categorias c ON p.categoria_id=c.id
      WHERE p.stock <= p.stock_minimo AND p.activo=1 ORDER BY p.stock ASC LIMIT 10`);

    res.json({
      esCajero: false, ventasHoy, ventasMes, ventasMesAnt, varMes,
      totalProductos, stockBajo, stockAgotado,
      ventasSemana, topProductos, porMetodo, movimientos, alertasStock
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
};