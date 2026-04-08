// ══════════════════════════════════════════════════════════════
//  etiquetasController.js  ·  V5 – Etiquetas / códigos de barras
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

exports.getProductos = async (req, res) => {
  try {
    const { search, categoria_id } = req.query;
    let q = `SELECT p.id, p.codigo, p.nombre, p.precio_venta,
               c.nombre AS categoria_nombre, p.stock
             FROM productos p
             LEFT JOIN categorias c ON p.categoria_id = c.id
             WHERE p.activo = 1`;
    const params = [];
    if (search) { q += ' AND (p.nombre LIKE ? OR p.codigo LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (categoria_id) { q += ' AND p.categoria_id=?'; params.push(categoria_id); }
    q += ' ORDER BY p.nombre LIMIT 200';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.generarHTML = async (req, res) => {
  // { items: [ { producto_id, cantidad } ] }
  const { items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Sin productos seleccionados' });

  try {
    let empresa = { nombre: 'Inventario Pro' };
    try {
      const [cfg] = await pool.query('SELECT clave, valor FROM empresa_config');
      empresa = Object.fromEntries(cfg.map(r => [r.clave, r.valor]));
    } catch {}

    const ids = items.map(i => i.producto_id);
    const [prods] = await pool.query(
      `SELECT id, codigo, nombre, precio_venta FROM productos WHERE id IN (?) AND activo=1`,
      [ids]
    );
    const prodMap = Object.fromEntries(prods.map(p => [p.id, p]));

    // Expandir según cantidad
    const etiquetas = [];
    for (const item of items) {
      const p = prodMap[item.producto_id];
      if (!p) continue;
      const qty = Math.min(parseInt(item.cantidad) || 1, 100);
      for (let i = 0; i < qty; i++) etiquetas.push(p);
    }

    const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Etiquetas – ${empresa.nombre}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 16px; }
  .toolbar { background: #fff; padding: 12px 20px; border-radius: 8px; margin-bottom: 16px; display: flex; gap: 12px; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .toolbar button { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
  .btn-print { background: #3a7aff; color: #fff; }
  .btn-print:hover { background: #2563eb; }
  .toolbar span { font-size: 12px; color: #888; }
  .grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .etiqueta {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 150px;
    padding: 8px;
    text-align: center;
    page-break-inside: avoid;
  }
  .etiqueta svg { width: 100%; height: auto; max-height: 50px; }
  .etiqueta .nombre { font-size: 9px; margin-top: 3px; font-weight: 600; color: #333; line-height: 1.2; word-break: break-word; }
  .etiqueta .precio { font-size: 12px; font-weight: 700; color: #1c1c1e; margin-top: 2px; }
  .etiqueta .empresa { font-size: 7px; color: #999; margin-top: 2px; }
  @media print {
    body { background: #fff; padding: 0; }
    .toolbar { display: none; }
    .etiqueta { border: 1px solid #ccc; }
    .grid { gap: 4px; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <button class="btn-print" onclick="window.print()">🖨️ Imprimir Etiquetas</button>
  <span>${etiquetas.length} etiqueta${etiquetas.length !== 1 ? 's' : ''} listas</span>
</div>
<div class="grid" id="grid">
${etiquetas.map((p, i) => `
  <div class="etiqueta">
    <svg id="bc${i}"></svg>
    <div class="nombre">${p.nombre}</div>
    <div class="precio">${fmt(p.precio_venta)}</div>
    <div class="empresa">${empresa.nombre || 'Inventario Pro'}</div>
  </div>`).join('\n')}
</div>
<script>
const prods = ${JSON.stringify(etiquetas.map((p, i) => ({ i, codigo: p.codigo })))};
prods.forEach(({i, codigo}) => {
  try {
    JsBarcode('#bc' + i, codigo, {
      format: 'CODE128',
      width: 1.5,
      height: 40,
      displayValue: true,
      fontSize: 9,
      margin: 2,
    });
  } catch(e) { console.warn('Barcode error:', codigo, e); }
});
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
