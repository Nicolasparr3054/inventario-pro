const { pool } = require('../config/database');

// ── Exportar ventas como CSV ─────────────────────────────────────────────────
exports.ventasCSV = async (req, res) => {
  try {
    const { desde, hasta, estado } = req.query;
    let q = `SELECT v.numero_venta, c.nombre AS cliente, u.nombre AS vendedor,
                    v.subtotal, v.descuento, v.impuesto, v.total,
                    v.metodo_pago, v.estado,
                    DATE_FORMAT(v.creado_en,'%Y-%m-%d %H:%i') AS fecha
             FROM ventas v
             LEFT JOIN clientes c ON v.cliente_id = c.id
             LEFT JOIN usuarios u ON v.usuario_id = u.id
             WHERE 1=1`;
    const p = [];
    if (desde)  { q += ' AND DATE(v.creado_en)>=?'; p.push(desde); }
    if (hasta)  { q += ' AND DATE(v.creado_en)<=?'; p.push(hasta); }
    if (estado) { q += ' AND v.estado=?'; p.push(estado); }
    q += ' ORDER BY v.creado_en DESC';

    const [rows] = await pool.query(q, p);

    const headers = ['N° Venta','Cliente','Vendedor','Subtotal','Descuento','Impuesto','Total','Método','Estado','Fecha'];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.numero_venta,
        `"${r.cliente || 'General'}"`,
        `"${r.vendedor || '-'}"`,
        r.subtotal, r.descuento, r.impuesto, r.total,
        r.metodo_pago, r.estado,
        r.fecha
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ventas-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv); // BOM para que Excel lo abra bien
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Reporte de stock como CSV ────────────────────────────────────────────────
exports.stockPDF = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.codigo, p.nombre, c.nombre AS categoria, p.stock,
              p.stock_minimo, p.precio_compra, p.precio_venta,
              CASE WHEN p.stock <= 0 THEN 'Agotado'
                   WHEN p.stock <= p.stock_minimo THEN 'Stock bajo'
                   ELSE 'OK' END AS estado
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.activo = 1
       ORDER BY p.stock ASC`
    );

    const headers = ['Código','Nombre','Categoría','Stock','Stock Mínimo','P. Compra','P. Venta','Estado'];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.codigo,
        `"${r.nombre}"`,
        `"${r.categoria || '-'}"`,
        r.stock, r.stock_minimo,
        r.precio_compra, r.precio_venta,
        r.estado
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="stock-${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Alias para mantener compatibilidad con ruta /reportes/ventas ─────────────
exports.ventasPDF = exports.ventasCSV;