import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum, fmtDateTime } from '../utils/format';
import toast from 'react-hot-toast';

const BAR_COLORS = ['#3a7aff', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error cargando dashboard'));
  }, []);

  if (!data) return <Layout title="Dashboard"><div className="spinner" /></Layout>;

  const { ventasHoy, ventasMes, totalProductos, stockBajo, ventasSemana, topProductos, movimientos } = data;

  const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const chartData = ventasSemana.map(v => ({
    dia: dias[new Date(v.fecha + 'T12:00:00').getDay()],
    total: Number(v.total),
  }));

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{label}</p>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>{fmt(payload[0]?.value)}</p>
      </div>
    );
  };

  return (
    <Layout title="Dashboard" alertCount={stockBajo.total}>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top-bar" style={{ background: 'var(--accent)' }} />
          <div className="stat-label">Ventas hoy</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{fmt(ventasHoy.total)}</div>
          <div className="stat-sub">{ventasHoy.cantidad} {ventasHoy.cantidad === 1 ? 'transacción' : 'transacciones'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-top-bar" style={{ background: 'var(--green)' }} />
          <div className="stat-label">Ventas del mes</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{fmt(ventasMes.total)}</div>
          <div className="stat-sub">{ventasMes.cantidad} transacciones</div>
        </div>
        <div className="stat-card">
          <div className="stat-top-bar" style={{ background: 'var(--purple)' }} />
          <div className="stat-label">Productos activos</div>
          <div className="stat-value">{fmtNum(totalProductos.total)}</div>
          <div className="stat-sub">en catálogo</div>
        </div>
        <div className="stat-card">
          <div className="stat-top-bar" style={{ background: stockBajo.total > 0 ? 'var(--amber)' : 'var(--green)' }} />
          <div className="stat-label">Stock bajo</div>
          <div className="stat-value" style={{ color: stockBajo.total > 0 ? 'var(--amber)' : 'var(--green)' }}>
            {stockBajo.total}
          </div>
          <div className="stat-sub">{stockBajo.total > 0 ? 'por reabastecer' : 'todo en orden'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 12, marginBottom: 16 }}>
        <div className="chart-card">
          <h3>Ventas — últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor="#3a7aff" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3a7aff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" stroke="transparent" tick={{ fill: 'var(--text4)', fontSize: 11 }} />
              <YAxis stroke="transparent" tick={{ fill: 'var(--text4)', fontSize: 10 }} width={60}
                tickFormatter={v => '$' + (v >= 1000 ? Math.round(v/1000) + 'k' : v)} />
              <Tooltip content={<Tip />} cursor={{ stroke: '#e8e6e2', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="total" stroke="#3a7aff" fill="url(#blueGrad)"
                strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3a7aff', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Top productos (30 días)</h3>
          {topProductos.length ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={topProductos} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <XAxis type="number" stroke="transparent" tick={{ fill: 'var(--text4)', fontSize: 10 }} />
                <YAxis type="category" dataKey="nombre" width={80} stroke="transparent"
                  tick={{ fill: 'var(--text4)', fontSize: 10 }}
                  tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v} />
                <Tooltip
                  formatter={v => [fmtNum(v), 'Unidades']}
                  contentStyle={{ background: '#fff', border: '0.5px solid #e8e6e2', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="vendidos" radius={[0, 4, 4, 0]}>
                  {topProductos.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text4)', fontSize: 13, marginTop: 20 }}>Sin datos este mes</p>}
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Movimientos recientes</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Producto</th><th>Tipo</th><th>Cantidad</th>
              <th>Stock anterior</th><th>Stock nuevo</th><th>Motivo</th><th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length ? movimientos.map(m => (
              <tr key={m.id}>
                <td>
                  <span style={{ fontWeight: 500 }}>{m.producto_nombre}</span><br />
                  <span className="mono">{m.codigo}</span>
                </td>
                <td>
                  <span className={`badge ${m.tipo === 'entrada' ? 'badge-green' : m.tipo === 'salida' ? 'badge-red' : 'badge-yellow'}`}>
                    {m.tipo}
                  </span>
                </td>
                <td className="mono">{m.tipo === 'salida' ? '-' : '+'}{fmtNum(m.cantidad)}</td>
                <td className="mono" style={{ color: 'var(--text3)' }}>{fmtNum(m.stock_anterior)}</td>
                <td className="mono" style={{ color: 'var(--text3)' }}>{fmtNum(m.stock_nuevo)}</td>
                <td style={{ color: 'var(--text2)' }}>{m.motivo}</td>
                <td style={{ color: 'var(--text4)', fontSize: 12 }}>{fmtDateTime(m.creado_en)}</td>
              </tr>
            )) : (
              <tr><td colSpan={7} className="empty-state">Sin movimientos recientes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}