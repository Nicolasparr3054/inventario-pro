// ══════════════════════════════════════════════════════════════
//  reportesAvanzadosController.js  ·  V5
// ══════════════════════════════════════════════════════════════
const { pool } = require('../config/database');

// ── Utilidades ───────────────────────────────────────────────
async function getEmpresa() {
  try {
    const [rows] = await pool.query('SELECT clave, valor FROM empresa_config');
    return Object.fromEntries(rows.map(r => [r.clave, r.valor]));
  } catch { return { nombre: 'Inventario Pro' }; }
}

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const pct = (n) => `${parseFloat(n || 0).toFixed(1)}%`;

function htmlBase(titulo, contenido, empresa) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${titulo} – ${empresa.nombre || 'Inventario Pro'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1c1c1e; background: #fff; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 2px solid #3a7aff; }
  .logo-area h1 { font-size: 22px; color: #3a7aff; font-weight: 700; }
  .logo-area p { font-size: 11px; color: #888; margin-top: 2px; }
  .empresa-info { text-align: right; font-size: 11px; color: #555; }
  .empresa-info strong { display: block; font-size: 13px; color: #1c1c1e; }
  h2 { font-size: 16px; margin-bottom: 14px; color: #1c1c1e; border-left: 3px solid #3a7aff; padding-left: 10px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; }
  th { background: #3a7aff; color: #fff; padding: 8px 10px; text-align: left; font-weight: 600; }
  td { padding: 7px 10px; border-bottom: 1px solid #f0eeeb; }
  tr:nth-child(even) td { background: #f9f8f7; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
  .green { background: #edf7f0; color: #16a34a; }
  .red { background: #fdf0f0; color: #dc2626; }
  .amber { background: #fef9ee; color: #d97706; }
  .kpi-row { display: flex; gap: 16px; margin-bottom: 24px; }
  .kpi { flex: 1; background: #f5f4f2; border-radius: 10px; padding: 14px 18px; }
  .kpi .val { font-size: 20px; font-weight: 700; color: #3a7aff; margin-top: 4px; }
  .kpi .lbl { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .bar-wrap { background: #f0eeeb; border-radius: 4px; height: 8px; margin-top: 6px; overflow: hidden; }
  .bar { height: 8px; background: #3a7aff; border-radius: 4px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e8e6e2; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }
  @media print { body { padding: 0; } button { display: none !important; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo-area">
    <h1>📊 ${titulo}</h1>
    <p>Generado el ${new Date().toLocaleString('es-CO')}</p>
  </div>
  <div class="empresa-info">
    <strong>${empresa.nombre || 'Inventario Pro'}</strong>
    ${empresa.nit ? `NIT: ${empresa.nit}` : ''}<br>
    ${empresa.ciudad || ''}
  </div>
</div>
${contenido}
<div class="footer">
  <span>${empresa.nombre || 'Inventario Pro'} · Inventario Pro V5</span>
  <span>Reporte generado automáticamente</span>
</div>
<script>window.onload = () => window.print();</script>
</body>
</html>`;
}

// ── Reporte 1: Rentabilidad por producto ─────────────────────
exports.rentabilidad = async (req, res) => {
  try {
    const empresa = await getEmpresa();
    const [rows] = await pool.query(`
      SELECT p.codigo, p.nombre, p.precio_compra, p.precio_venta,
        COALESCE(SUM(vd.cantidad), 0) AS unidades_vendidas,
        COALESCE(SUM(vd.subtotal), 0) AS ingresos,
        COALESCE(SUM(vd.cantidad * p.precio_compra), 0) AS costo_total,
        COALESCE(SUM(vd.subtotal) - SUM(vd.cantidad * p.precio_compra), 0) AS utilidad,
        CASE WHEN SUM(vd.subtotal) > 0
          THEN ((SUM(vd.subtotal) - SUM(vd.cantidad * p.precio_compra)) / SUM(vd.subtotal)) * 100
          ELSE 0
        END AS margen_pct
      FROM productos p
      LEFT JOIN venta_detalles vd ON p.id = vd.producto_id
      LEFT JOIN ventas v ON vd.venta_id = v.id AND v.estado != 'anulada'
      WHERE p.activo = 1
      GROUP BY p.id
      ORDER BY utilidad DESC
    `);

    const totalIngresos = rows.reduce((s, r) => s + parseFloat(r.ingresos), 0);
    const totalUtilidad = rows.reduce((s, r) => s + parseFloat(r.utilidad), 0);
    const totalCosto    = rows.reduce((s, r) => s + parseFloat(r.costo_total), 0);
    const margenGlobal  = totalIngresos > 0 ? (totalUtilidad / totalIngresos) * 100 : 0;

    const filas = rows.map(r => {
      const margen = parseFloat(r.margen_pct);
      const cls = margen >= 30 ? 'green' : margen >= 10 ? 'amber' : 'red';
      const maxUtil = Math.max(...rows.map(x => parseFloat(x.utilidad)));
      const barW = maxUtil > 0 ? (parseFloat(r.utilidad) / maxUtil * 100).toFixed(0) : 0;
      return `<tr>
        <td>${r.codigo}</td>
        <td>${r.nombre}</td>
        <td class="num">${fmt(r.precio_compra)}</td>
        <td class="num">${fmt(r.precio_venta)}</td>
        <td class="num">${parseInt(r.unidades_vendidas)}</td>
        <td class="num">${fmt(r.ingresos)}</td>
        <td class="num">${fmt(r.costo_total)}</td>
        <td class="num">${fmt(r.utilidad)}<div class="bar-wrap"><div class="bar" style="width:${barW}%"></div></div></td>
        <td class="num"><span class="badge ${cls}">${pct(margen)}</span></td>
      </tr>`;
    }).join('');

    const contenido = `
    <div class="kpi-row">
      <div class="kpi"><div class="lbl">Ingresos Totales</div><div class="val">${fmt(totalIngresos)}</div></div>
      <div class="kpi"><div class="lbl">Costo Total</div><div class="val">${fmt(totalCosto)}</div></div>
      <div class="kpi"><div class="lbl">Utilidad Total</div><div class="val">${fmt(totalUtilidad)}</div></div>
      <div class="kpi"><div class="lbl">Margen Global</div><div class="val">${pct(margenGlobal)}</div></div>
    </div>
    <h2>Rentabilidad por Producto</h2>
    <table>
      <thead><tr>
        <th>Código</th><th>Producto</th><th class="num">P. Compra</th><th class="num">P. Venta</th>
        <th class="num">Und. Vendidas</th><th class="num">Ingresos</th><th class="num">Costo</th>
        <th class="num">Utilidad</th><th class="num">Margen</th>
      </tr></thead>
      <tbody>${filas}</tbody>
      <tfoot><tr style="font-weight:700;border-top:2px solid #ddd">
        <td colspan="5">TOTAL</td>
        <td class="num">${fmt(totalIngresos)}</td>
        <td class="num">${fmt(totalCosto)}</td>
        <td class="num">${fmt(totalUtilidad)}</td>
        <td class="num">${pct(margenGlobal)}</td>
      </tr></tfoot>
    </table>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlBase('Rentabilidad por Producto', contenido, empresa));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Reporte 2: Top 10 productos más vendidos del mes ─────────
exports.top10Mes = async (req, res) => {
  try {
    const empresa = await getEmpresa();
    const hoy = new Date();
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}`;
    const [rows] = await pool.query(`
      SELECT p.codigo, p.nombre, p.precio_venta,
        SUM(vd.cantidad) AS unidades,
        SUM(vd.subtotal) AS total_venta,
        SUM(vd.cantidad * p.precio_compra) AS costo,
        SUM(vd.subtotal) - SUM(vd.cantidad * p.precio_compra) AS utilidad
      FROM venta_detalles vd
      JOIN productos p ON vd.producto_id = p.id
      JOIN ventas v ON vd.venta_id = v.id
      WHERE DATE_FORMAT(v.creado_en, '%Y-%m') = ? AND v.estado != 'anulada'
      GROUP BY p.id
      ORDER BY unidades DESC
      LIMIT 10
    `, [mesActual]);

    const totalUnd = rows.reduce((s, r) => s + parseInt(r.unidades), 0);
    const totalVta = rows.reduce((s, r) => s + parseFloat(r.total_venta), 0);
    const maxUnd   = rows.length ? parseInt(rows[0].unidades) : 1;

    const nombreMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toLocaleString('es-CO', { month: 'long', year: 'numeric' });

    const filas = rows.map((r, i) => {
      const barW = (parseInt(r.unidades) / maxUnd * 100).toFixed(0);
      return `<tr>
        <td style="font-weight:700;color:#3a7aff">#${i+1}</td>
        <td>${r.codigo}</td>
        <td>${r.nombre}</td>
        <td class="num">${parseInt(r.unidades)}<div class="bar-wrap"><div class="bar" style="width:${barW}%"></div></div></td>
        <td class="num">${fmt(r.total_venta)}</td>
        <td class="num">${fmt(r.utilidad)}</td>
      </tr>`;
    }).join('');

    const contenido = `
    <div class="kpi-row">
      <div class="kpi"><div class="lbl">Mes analizado</div><div class="val" style="font-size:15px">${nombreMes}</div></div>
      <div class="kpi"><div class="lbl">Total unidades</div><div class="val">${totalUnd}</div></div>
      <div class="kpi"><div class="lbl">Total ventas</div><div class="val">${fmt(totalVta)}</div></div>
    </div>
    <h2>Top 10 Productos Más Vendidos – ${nombreMes}</h2>
    <table>
      <thead><tr><th>#</th><th>Código</th><th>Producto</th><th class="num">Unidades</th><th class="num">Total Venta</th><th class="num">Utilidad</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlBase('Top 10 Productos del Mes', contenido, empresa));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Reporte 3: Comparativo mensual últimos 6 meses ───────────
exports.comparativoMensual = async (req, res) => {
  try {
    const empresa = await getEmpresa();
    const [rows] = await pool.query(`
      SELECT
        DATE_FORMAT(v.creado_en, '%Y-%m') AS mes,
        COUNT(DISTINCT v.id) AS num_ventas,
        SUM(v.total) AS total_ventas,
        SUM(v.descuento) AS total_descuentos,
        COUNT(DISTINCT v.cliente_id) AS clientes_unicos,
        AVG(v.total) AS ticket_promedio
      FROM ventas v
      WHERE v.estado != 'anulada'
        AND v.creado_en >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes ASC
    `);

    const meses = rows.map(r => {
      const [anio, mes] = r.mes.split('-');
      return new Date(parseInt(anio), parseInt(mes)-1, 1)
        .toLocaleString('es-CO', { month: 'short', year: '2-digit' });
    });

    const maxVenta = Math.max(...rows.map(r => parseFloat(r.total_ventas) || 0), 1);

    const filas = rows.map((r, i) => {
      const prev = rows[i-1];
      const delta = prev ? ((parseFloat(r.total_ventas) - parseFloat(prev.total_ventas)) / parseFloat(prev.total_ventas) * 100) : null;
      const deltaStr = delta !== null
        ? `<span class="badge ${delta >= 0 ? 'green' : 'red'}">${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(1)}%</span>`
        : '<span class="badge amber">–</span>';
      const barW = (parseFloat(r.total_ventas) / maxVenta * 100).toFixed(0);
      return `<tr>
        <td><strong>${meses[i]}</strong></td>
        <td class="num">${parseInt(r.num_ventas)}</td>
        <td class="num">${fmt(r.total_ventas)}<div class="bar-wrap"><div class="bar" style="width:${barW}%"></div></div></td>
        <td class="num">${fmt(r.ticket_promedio)}</td>
        <td class="num">${fmt(r.total_descuentos)}</td>
        <td class="num">${parseInt(r.clientes_unicos)}</td>
        <td class="num">${deltaStr}</td>
      </tr>`;
    }).join('');

    const totalVtas  = rows.reduce((s, r) => s + parseFloat(r.total_ventas || 0), 0);
    const totalTx    = rows.reduce((s, r) => s + parseInt(r.num_ventas || 0), 0);
    const avgTicket  = totalTx > 0 ? totalVtas / totalTx : 0;

    const contenido = `
    <div class="kpi-row">
      <div class="kpi"><div class="lbl">Período</div><div class="val" style="font-size:14px">Últimos 6 meses</div></div>
      <div class="kpi"><div class="lbl">Total Ventas</div><div class="val">${fmt(totalVtas)}</div></div>
      <div class="kpi"><div class="lbl">Transacciones</div><div class="val">${totalTx}</div></div>
      <div class="kpi"><div class="lbl">Ticket Promedio</div><div class="val">${fmt(avgTicket)}</div></div>
    </div>
    <h2>Comparativo Mensual – Últimos 6 Meses</h2>
    <table>
      <thead><tr>
        <th>Mes</th><th class="num">Ventas #</th><th class="num">Total Ventas</th>
        <th class="num">Ticket Prom.</th><th class="num">Descuentos</th>
        <th class="num">Clientes</th><th class="num">vs Mes Ant.</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlBase('Comparativo Mensual', contenido, empresa));
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// ── Datos JSON para dashboard de reportes ────────────────────
exports.getDatos = async (req, res) => {
  try {
    const [rentabilidad] = await pool.query(`
      SELECT p.id, p.nombre, p.precio_compra, p.precio_venta,
        COALESCE(SUM(vd.cantidad),0) AS unidades,
        COALESCE(SUM(vd.subtotal),0) AS ingresos,
        COALESCE(SUM(vd.subtotal) - SUM(vd.cantidad*p.precio_compra),0) AS utilidad
      FROM productos p
      LEFT JOIN venta_detalles vd ON p.id=vd.producto_id
      LEFT JOIN ventas v ON vd.venta_id=v.id AND v.estado!='anulada'
      WHERE p.activo=1 GROUP BY p.id ORDER BY utilidad DESC LIMIT 20
    `);
    const [mensual] = await pool.query(`
      SELECT DATE_FORMAT(v.creado_en,'%Y-%m') AS mes,
        COUNT(DISTINCT v.id) AS num_ventas, SUM(v.total) AS total
      FROM ventas v WHERE v.estado!='anulada' AND v.creado_en>=DATE_SUB(CURDATE(),INTERVAL 6 MONTH)
      GROUP BY mes ORDER BY mes ASC
    `);
    const [top10] = await pool.query(`
      SELECT p.nombre, SUM(vd.cantidad) AS unidades, SUM(vd.subtotal) AS total
      FROM venta_detalles vd JOIN productos p ON vd.producto_id=p.id
      JOIN ventas v ON vd.venta_id=v.id
      WHERE DATE_FORMAT(v.creado_en,'%Y-%m')=DATE_FORMAT(NOW(),'%Y-%m') AND v.estado!='anulada'
      GROUP BY p.id ORDER BY unidades DESC LIMIT 10
    `);
    res.json({ rentabilidad, mensual, top10 });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
