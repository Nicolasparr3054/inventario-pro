import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend } from 'recharts';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum, fmtDateTime } from '../utils/format';
import toast from 'react-hot-toast';

const BAR_COLORS = ['#3a7aff','#22c55e','#8b5cf6','#f59e0b','#ef4444'];
const PIE_COLORS = { efectivo:'#22c55e', tarjeta:'#3a7aff', transferencia:'#8b5cf6', otro:'#f59e0b' };

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#fff',border:'0.5px solid #e8e6e2',borderRadius:8,padding:'10px 14px',boxShadow:'0 4px 16px rgba(0,0,0,0.08)'}}>
      <p style={{fontSize:11,color:'var(--text3)',marginBottom:3}}>{label}</p>
      <p style={{fontSize:15,fontWeight:600,color:'var(--accent)'}}>{fmt(payload[0]?.value)}</p>
    </div>
  );
};

const Variacion = ({ valor }) => {
  if (valor === null || valor === undefined) return <span style={{fontSize:11,color:'var(--text3)'}}>sin datos mes ant.</span>;
  const color = valor >= 0 ? 'var(--green)' : 'var(--red)';
  const icono = valor >= 0 ? '▲' : '▼';
  return <span style={{fontSize:11,color,fontWeight:600}}>{icono} {Math.abs(valor)}% vs mes ant.</span>;
};

// ── Vista cajero ─────────────────────────────────────────────────────────────
function DashboardCajero({ data }) {
  const { ventasHoy, ventasMes, ultimasVentas } = data;
  return (
    <Layout title="Mi Resumen">
      <div className="stat-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="stat-card">
          <div className="stat-top-bar" style={{background:'var(--accent)'}}/>
          <div className="stat-label">Mis ventas hoy</div>
          <div className="stat-value" style={{color:'var(--accent)'}}>{fmt(ventasHoy.total)}</div>
          <div className="stat-sub">{ventasHoy.cantidad} {ventasHoy.cantidad===1?'transacción':'transacciones'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-top-bar" style={{background:'var(--green)'}}/>
          <div className="stat-label">Mis ventas del mes</div>
          <div className="stat-value" style={{color:'var(--green)'}}>{fmt(ventasMes.total)}</div>
          <div className="stat-sub">{ventasMes.cantidad} transacciones</div>
        </div>
      </div>

      <div className="table-wrapper" style={{marginTop:16}}>
        <div className="table-header">
          <span className="table-title">Mis últimas ventas</span>
        </div>
        <table>
          <thead>
            <tr><th>N° Venta</th><th>Cliente</th><th>Items</th><th>Total</th><th>Método</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {ultimasVentas.length ? ultimasVentas.map(v=>(
              <tr key={v.numero_venta}>
                <td><span className="mono" style={{fontSize:12,color:'var(--accent)'}}>{v.numero_venta}</span></td>
                <td>{v.cliente_nombre||<span style={{color:'var(--text3)'}}>General</span>}</td>
                <td className="mono">{v.total_items}</td>
                <td className="mono" style={{fontWeight:700}}>{fmt(v.total)}</td>
                <td><span className="badge badge-blue">{v.metodo_pago}</span></td>
                <td style={{color:'var(--text3)',fontSize:12}}>{fmtDateTime(v.creado_en)}</td>
              </tr>
            )) : (
              <tr><td colSpan={6}><div className="empty-state">No has realizado ventas hoy</div></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{marginTop:16,background:'var(--accent)',borderRadius:10,padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <p style={{color:'#fff',fontWeight:600,fontSize:15,marginBottom:4}}>¿Listo para vender?</p>
          <p style={{color:'rgba(255,255,255,0.7)',fontSize:12}}>Registra una nueva venta desde el punto de venta</p>
        </div>
        <a href="/pos" className="btn" style={{background:'#fff',color:'var(--accent)',fontWeight:600,padding:'10px 20px'}}>
          Punto de Venta →
        </a>
      </div>
    </Layout>
  );
}

// ── Vista admin ───────────────────────────────────────────────────────────────
function DashboardAdmin({ data }) {
  const { ventasHoy, ventasMes, varMes, totalProductos, stockBajo, stockAgotado,
          ventasSemana, topProductos, porMetodo, movimientos, alertasStock } = data;

  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const chartData = ventasSemana.map(v => ({
    dia: dias[new Date(v.fecha+'T12:00:00').getDay()],
    total: Number(v.total),
  }));

  const pieData = porMetodo.map(m => ({
    name: m.metodo_pago, value: Number(m.total),
    color: PIE_COLORS[m.metodo_pago] || '#ccc'
  }));

  return (
    <Layout title="Dashboard" alertCount={stockBajo.total}>
      {alertasStock.length > 0 && (
        <div style={{background:'#fef9ee',border:'0.5px solid #fde68a',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',gap:12,alignItems:'flex-start'}}>
          <span style={{fontSize:18}}>⚠️</span>
          <div>
            <p style={{fontWeight:600,fontSize:13,color:'#92400e',marginBottom:4}}>
              {alertasStock.length} producto{alertasStock.length>1?'s':''} con stock bajo
            </p>
            <p style={{fontSize:12,color:'#b45309'}}>
              {alertasStock.map(p=>`${p.nombre} (${p.stock}/${p.stock_minimo})`).join(' · ')}
            </p>
          </div>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top-bar" style={{background:'var(--accent)'}}/>
          <div className="stat-label">Ventas hoy</div>
          <div className="stat-value" style={{color:'var(--accent)'}}>{fmt(ventasHoy.total)}</div>
          <div className="stat-sub">{ventasHoy.cantidad} {ventasHoy.cantidad===1?'transacción':'transacciones'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-top-bar" style={{background:'var(--green)'}}/>
          <div className="stat-label">Ventas del mes</div>
          <div className="stat-value" style={{color:'var(--green)'}}>{fmt(ventasMes.total)}</div>
          <div className="stat-sub"><Variacion valor={varMes}/></div>
        </div>
        <div className="stat-card">
          <div className="stat-top-bar" style={{background:'var(--purple)'}}/>
          <div className="stat-label">Productos activos</div>
          <div className="stat-value">{fmtNum(totalProductos.total)}</div>
          <div className="stat-sub">en catálogo</div>
        </div>
        <div className="stat-card">
          <div className="stat-top-bar" style={{background: stockAgotado.total>0?'var(--red)':stockBajo.total>0?'var(--amber)':'var(--green)'}}/>
          <div className="stat-label">Stock crítico</div>
          <div className="stat-value" style={{color: stockAgotado.total>0?'var(--red)':stockBajo.total>0?'var(--amber)':'var(--green)'}}>
            {stockBajo.total}
          </div>
          <div className="stat-sub">
            {stockAgotado.total>0?`${stockAgotado.total} agotado${stockAgotado.total>1?'s':''}`:stockBajo.total>0?'por reabastecer':'todo en orden'}
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 200px',gap:12,marginBottom:16}}>
        <div className="chart-card">
          <h3>Ventas — últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={chartData} margin={{top:4,right:4,bottom:0,left:0}}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3a7aff" stopOpacity={0.15}/>
                  <stop offset="100%" stopColor="#3a7aff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" stroke="transparent" tick={{fill:'var(--text4)',fontSize:11}}/>
              <YAxis stroke="transparent" tick={{fill:'var(--text4)',fontSize:10}} width={60}
                tickFormatter={v=>'$'+(v>=1000?Math.round(v/1000)+'k':v)}/>
              <Tooltip content={<Tip/>} cursor={{stroke:'#e8e6e2',strokeWidth:1}}/>
              <Area type="monotone" dataKey="total" stroke="#3a7aff" fill="url(#blueGrad)"
                strokeWidth={2} dot={false} activeDot={{r:4,fill:'#3a7aff',stroke:'#fff',strokeWidth:2}}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-card">
          <h3>Métodos de pago</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} paddingAngle={3}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip formatter={v=>[fmt(v),'Total']} contentStyle={{background:'#fff',border:'0.5px solid #e8e6e2',borderRadius:8,fontSize:12}}/>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{color:'var(--text4)',fontSize:13,marginTop:20,textAlign:'center'}}>Sin ventas este mes</p>}
        </div>
      </div>

      <div className="chart-card" style={{marginBottom:16}}>
        <h3>Top productos — últimos 30 días</h3>
        {topProductos.length ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={topProductos} layout="vertical" margin={{top:0,right:8,bottom:0,left:0}}>
              <XAxis type="number" stroke="transparent" tick={{fill:'var(--text4)',fontSize:10}}/>
              <YAxis type="category" dataKey="nombre" width={100} stroke="transparent"
                tick={{fill:'var(--text4)',fontSize:10}}
                tickFormatter={v=>v.length>14?v.slice(0,14)+'…':v}/>
              <Tooltip formatter={v=>[fmtNum(v),'Unidades']} contentStyle={{background:'#fff',border:'0.5px solid #e8e6e2',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="vendidos" radius={[0,4,4,0]}>
                {topProductos.map((_,i)=><Cell key={i} fill={BAR_COLORS[i%BAR_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p style={{color:'var(--text4)',fontSize:13,marginTop:16}}>Sin datos este mes</p>}
      </div>

      <div className="table-wrapper">
        <div className="table-header"><span className="table-title">Movimientos recientes</span></div>
        <table>
          <thead>
            <tr><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Stock ant.</th><th>Stock nuevo</th><th>Motivo</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {movimientos.length ? movimientos.map(m=>(
              <tr key={m.id}>
                <td><span style={{fontWeight:500}}>{m.producto_nombre}</span><br/><span className="mono">{m.codigo}</span></td>
                <td><span className={`badge ${m.tipo==='entrada'?'badge-green':m.tipo==='salida'?'badge-red':'badge-yellow'}`}>{m.tipo}</span></td>
                <td className="mono">{m.tipo==='salida'?'-':'+'}{fmtNum(m.cantidad)}</td>
                <td className="mono" style={{color:'var(--text3)'}}>{fmtNum(m.stock_anterior)}</td>
                <td className="mono" style={{color:'var(--text3)'}}>{fmtNum(m.stock_nuevo)}</td>
                <td style={{color:'var(--text2)'}}>{m.motivo}</td>
                <td style={{color:'var(--text4)',fontSize:12}}>{fmtDateTime(m.creado_en)}</td>
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

// ── Principal ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .catch(() => toast.error('Error cargando dashboard'));
  }, []);

  if (!data) return <Layout title="Dashboard"><div className="spinner"/></Layout>;

  return data.esCajero
    ? <DashboardCajero data={data}/>
    : <DashboardAdmin  data={data}/>;
}