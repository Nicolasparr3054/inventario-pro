// ══════════════════════════════════════════════════════════════
//  facturaController.js  ·  V4 – PDF con logo + datos empresa
//                              + Config empresa + Notificaciones
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

// ─── Helpers de empresa ──────────────────────────────────────
const getEmpresaConfig = async () => {
  const [rows] = await pool.query('SELECT clave, valor FROM empresa_config');
  return Object.fromEntries(rows.map(r => [r.clave, r.valor]));
};

// ─── Empresa config ──────────────────────────────────────────

// GET /empresa/config
exports.getConfig = async (req, res) => {
  try {
    const config = await getEmpresaConfig();
    res.json(config);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PUT /empresa/config
exports.updateConfig = async (req, res) => {
  const campos = ['nombre','nit','direccion','telefono','email','ciudad','logo_url','moneda','pie_factura'];
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    for (const campo of campos) {
      if (req.body[campo] !== undefined) {
        await conn.query(
          'INSERT INTO empresa_config (clave, valor) VALUES (?,?) ON DUPLICATE KEY UPDATE valor=?',
          [campo, req.body[campo], req.body[campo]]
        );
      }
    }
    await conn.commit();
    res.json({ message: 'Configuración actualizada' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
};

// ─── Factura PDF ──────────────────────────────────────────────

// GET /ventas/:id/factura
// Acepta token por header Authorization O por query param ?token=
exports.facturaPDF = async (req, res) => {
  // Validar token (header o query param)
  const jwt = require('jsonwebtoken');
  const token = req.query.token || (req.headers['authorization']?.split(' ')[1]);
  if (!token) return res.status(401).send('<h2>Token requerido</h2>');
  try { jwt.verify(token, process.env.JWT_SECRET); } catch {
    return res.status(403).send('<h2>Token inválido o expirado. Cierra esta pestaña y vuelve a intentarlo.</h2>');
  }

  try {
    const [[venta]] = await pool.query(
      `SELECT v.*, c.nombre AS cliente_nombre, c.nit AS cliente_nit,
              c.direccion AS cliente_dir, c.telefono AS cliente_tel, c.email AS cliente_email,
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

    const empresa = await getEmpresaConfig();
    const fmt = n => `$${Number(n || 0).toLocaleString('es-CO')}`;
    const fmtDate = d => new Date(d).toLocaleString('es-CO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

    const itemsHTML = detalles.map(d => `
      <tr>
        <td>${d.producto_codigo || ''}</td>
        <td>${d.producto_nombre}</td>
        <td class="num">${d.cantidad}</td>
        <td class="num">${fmt(d.precio_unit)}</td>
        <td class="num">${fmt(d.subtotal)}</td>
      </tr>`).join('');

    const logoHTML = empresa.logo_url
      ? `<img src="${empresa.logo_url}" alt="Logo" style="max-height:60px;max-width:180px;object-fit:contain;"/>`
      : `<div style="font-size:22px;font-weight:700;color:#1c1c1e;">${empresa.nombre}</div>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Factura ${venta.numero_venta}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Inter',sans-serif;font-size:11px;color:#1c1c1e;background:#fff;padding:32px;}
  .invoice{max-width:720px;margin:0 auto;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #1c1c1e;}
  .empresa-data{max-width:280px;}
  .empresa-data p{font-size:10px;color:#555;margin-top:2px;line-height:1.5;}
  .invoice-meta{text-align:right;}
  .invoice-meta h1{font-size:24px;font-weight:700;letter-spacing:-0.5px;color:#3a7aff;margin-bottom:6px;}
  .invoice-meta p{font-size:10px;color:#555;line-height:1.6;}
  .invoice-meta .num-venta{font-size:13px;font-weight:600;color:#1c1c1e;margin-bottom:2px;}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;}
  .party-box{background:#f5f4f2;border-radius:8px;padding:14px 16px;}
  .party-box h4{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:8px;}
  .party-box p{font-size:10.5px;color:#1c1c1e;line-height:1.7;}
  table{width:100%;border-collapse:collapse;margin-bottom:20px;}
  thead tr{background:#1c1c1e;color:#fff;}
  th{padding:9px 12px;text-align:left;font-size:9px;font-weight:500;text-transform:uppercase;letter-spacing:0.8px;}
  td{padding:9px 12px;border-bottom:1px solid #f0eeeb;font-size:10.5px;}
  td.num{text-align:right;font-family:monospace;}
  tbody tr:hover td{background:#faf9f8;}
  .totals{display:flex;justify-content:flex-end;margin-bottom:24px;}
  .totals-box{min-width:240px;}
  .t-row{display:flex;justify-content:space-between;padding:5px 0;font-size:11px;color:#555;}
  .t-row.discount{color:#22c55e;}
  .t-row.grand{border-top:2px solid #1c1c1e;margin-top:8px;padding-top:10px;font-size:15px;font-weight:700;color:#1c1c1e;}
  .footer{border-top:1px solid #e8e6e2;padding-top:16px;text-align:center;color:#888;font-size:10px;}
  .badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:20px;font-size:9px;font-weight:600;background:#eef3ff;color:#1a56d6;text-transform:uppercase;letter-spacing:0.5px;}
  @media print{body{padding:0;}.invoice{max-width:100%;}}
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div class="empresa-data">
      ${logoHTML}
      <p style="margin-top:8px;"><strong>${empresa.nombre}</strong></p>
      <p>NIT: ${empresa.nit}</p>
      <p>${empresa.direccion}</p>
      <p>${empresa.ciudad}</p>
      <p>${empresa.telefono}</p>
      <p>${empresa.email}</p>
    </div>
    <div class="invoice-meta">
      <h1>FACTURA</h1>
      <p class="num-venta">${venta.numero_venta}</p>
      <p>Fecha: <strong>${fmtDate(venta.creado_en)}</strong></p>
      <p>Pago: <strong>${venta.metodo_pago}</strong></p>
      <p style="margin-top:6px;"><span class="badge">${venta.estado}</span></p>
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <h4>Datos del cliente</h4>
      <p><strong>${venta.cliente_nombre || 'Cliente General'}</strong></p>
      ${venta.cliente_nit ? `<p>NIT/CC: ${venta.cliente_nit}</p>` : ''}
      ${venta.cliente_dir ? `<p>${venta.cliente_dir}</p>` : ''}
      ${venta.cliente_tel ? `<p>Tel: ${venta.cliente_tel}</p>` : ''}
      ${venta.cliente_email ? `<p>${venta.cliente_email}</p>` : ''}
    </div>
    <div class="party-box">
      <h4>Vendedor</h4>
      <p><strong>${venta.vendedor_nombre || '-'}</strong></p>
      ${venta.notas ? `<p style="margin-top:8px;color:#555;">Notas: ${venta.notas}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descripción</th>
        <th style="text-align:right">Cant.</th>
        <th style="text-align:right">Precio unit.</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="t-row"><span>Subtotal</span><span>${fmt(venta.subtotal)}</span></div>
      ${Number(venta.impuesto) > 0 ? `<div class="t-row"><span>IVA</span><span>${fmt(venta.impuesto)}</span></div>` : ''}
      ${Number(venta.descuento) > 0 ? `<div class="t-row discount"><span>Descuento</span><span>−${fmt(venta.descuento)}</span></div>` : ''}
      <div class="t-row grand"><span>TOTAL</span><span>${fmt(venta.total)}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>${empresa.pie_factura || '¡Gracias por su compra!'}</p>
    <p style="margin-top:6px;color:#bbb;">Generado por Inventario Pro · ${new Date().toLocaleDateString('es-CO')}</p>
  </div>
</div>
<script>
  // Auto-print si se abre en nueva ventana
  if (window.opener) { window.onload = () => window.print(); }
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ─── Notificaciones ──────────────────────────────────────────

// GET /notificaciones
exports.getNotificaciones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM notificaciones
       WHERE (usuario_id IS NULL OR usuario_id=?)
       ORDER BY creado_en DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// GET /notificaciones/no-leidas
exports.getNoLeidas = async (req, res) => {
  try {
    const [[r]] = await pool.query(
      `SELECT COUNT(*) AS total FROM notificaciones
       WHERE (usuario_id IS NULL OR usuario_id=?) AND leida=0`,
      [req.user.id]
    );
    res.json({ total: r.total });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PATCH /notificaciones/:id/leer
exports.marcarLeida = async (req, res) => {
  try {
    await pool.query('UPDATE notificaciones SET leida=1 WHERE id=?', [req.params.id]);
    res.json({ message: 'Marcada como leída' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// PATCH /notificaciones/leer-todas
exports.marcarTodasLeidas = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notificaciones SET leida=1 WHERE (usuario_id IS NULL OR usuario_id=?)',
      [req.user.id]
    );
    res.json({ message: 'Todas marcadas como leídas' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// POST /notificaciones/verificar-stock
// Revisa stock bajo y crea notificaciones nuevas si no existen
exports.verificarStock = async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT id, nombre, stock, stock_minimo FROM productos
       WHERE stock <= stock_minimo AND activo=1`
    );
    let creadas = 0;
    for (const p of productos) {
      const [existe] = await pool.query(
        `SELECT id FROM notificaciones
         WHERE tipo='stock_bajo' AND referencia_id=? AND referencia_tipo='producto'
           AND leida=0 AND creado_en > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [p.id]
      );
      if (!existe.length) {
        await pool.query(
          `INSERT INTO notificaciones (tipo, titulo, mensaje, referencia_id, referencia_tipo)
           VALUES ('stock_bajo', ?, ?, ?, 'producto')`,
          [
            `Stock bajo: ${p.nombre}`,
            `El producto "${p.nombre}" tiene ${p.stock} unidades (mínimo: ${p.stock_minimo})`,
            p.id
          ]
        );
        creadas++;
      }
    }
    res.json({ productos_bajo_stock: productos.length, notificaciones_creadas: creadas });
  } catch (err) { res.status(500).json({ error: err.message }); }
};