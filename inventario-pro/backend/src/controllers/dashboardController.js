const { pool } = require('../config/database');

exports.getStats = async (req, res) => {
  try {
    const [[ventasHoy]]    = await pool.query(`SELECT COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad FROM ventas WHERE DATE(creado_en)=CURDATE() AND estado='completada'`);
    const [[ventasMes]]    = await pool.query(`SELECT COALESCE(SUM(total),0) AS total FROM ventas WHERE MONTH(creado_en)=MONTH(CURDATE()) AND YEAR(creado_en)=YEAR(CURDATE()) AND estado='completada'`);
    const [[totalProductos]]= await pool.query(`SELECT COUNT(*) AS total FROM productos WHERE activo=1`);
    const [[stockBajo]]    = await pool.query(`SELECT COUNT(*) AS total FROM productos WHERE stock<=stock_minimo AND activo=1`);

    const [ventasSemana] = await pool.query(`
      SELECT DATE(creado_en) AS fecha,
             COALESCE(SUM(total),0) AS total,
             COUNT(*) AS cantidad
      FROM ventas
      WHERE creado_en >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND estado='completada'
      GROUP BY DATE(creado_en)
      ORDER BY fecha`);

    const [topProductos] = await pool.query(`
      SELECT p.nombre, SUM(vd.cantidad) AS vendidos, SUM(vd.subtotal) AS ingresos
      FROM venta_detalles vd
      JOIN productos p ON vd.producto_id=p.id
      JOIN ventas v ON vd.venta_id=v.id
      WHERE v.estado='completada' AND v.creado_en >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY p.id ORDER BY vendidos DESC LIMIT 5`);

    const [movimientos] = await pool.query(`
      SELECT m.*, p.nombre AS producto_nombre, p.codigo
      FROM movimientos_inventario m
      JOIN productos p ON m.producto_id=p.id
      ORDER BY m.creado_en DESC LIMIT 10`);

    res.json({ ventasHoy, ventasMes, totalProductos, stockBajo, ventasSemana, topProductos, movimientos });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
