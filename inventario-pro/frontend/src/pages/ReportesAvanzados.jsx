// ══════════════════════════════════════════════════════════════
//  ReportesAvanzados.jsx  ·  V5 – Reportes avanzados (admin)
// ══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum } from '../utils/format';
import toast from 'react-hot-toast';

export default function ReportesAvanzados() {
  const [datos, setDatos]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reportes-avanzados/datos')
      .then(r => setDatos(r.data))
      .catch(() => toast.error('Error cargando datos'))
      .finally(() => setLoading(false));
  }, []);

  const abrirReporte = async (tipo) => {
    const token = localStorage.getItem('token');
    const url = `/api/reportes-avanzados/${tipo}?token=${token}`;
    window.open(url, '_blank');
  };

  // Calcular el máximo para barras
  const maxUtil = datos?.rentabilidad?.length
    ? Math.max(...datos.rentabilidad.map(p => parseFloat(p.utilidad) || 0), 1)
    : 1;
  const maxVenta = datos?.mensual?.length
    ? Math.max(...datos.mensual.map(m => parseFloat(m.total) || 0), 1)
    : 1;
  const maxUnd = datos?.top10?.length
    ? Math.max(...datos.top10.map(p => parseInt(p.unidades) || 0), 1)
    : 1;

  const nombreMes = (mesStr) => {
    if (!mesStr) return '';
    const [a, m] = mesStr.split('-');
    return new Date(parseInt(a), parseInt(m)-1, 1)
      .toLocaleString('es-CO', { month: 'short', year: '2-digit' });
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Reportes Avanzados</h1>
          <p className="page-sub">Análisis de rentabilidad, tendencias y desempeño</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => abrirReporte('rentabilidad')}>
            🖨️ Rentabilidad PDF
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => abrirReporte('top10-mes')}>
            🖨️ Top 10 PDF
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => abrirReporte('comparativo')}>
            🖨️ Comparativo PDF
          </button>
        </div>
      </div>

      {loading && <div className="spinner" style={{ margin:'60px auto' }} />}

      {!loading && datos && (
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

          {/* KPIs rápidos */}
          <div className="kpi-grid">
            {(() => {
              const totalIngresos = datos.rentabilidad.reduce((s,p) => s+parseFloat(p.ingresos||0), 0);
              const totalUtil     = datos.rentabilidad.reduce((s,p) => s+parseFloat(p.utilidad||0), 0);
              const totalUndTotal = datos.rentabilidad.reduce((s,p) => s+parseInt(p.unidades||0), 0);
              const margen = totalIngresos > 0 ? (totalUtil/totalIngresos*100).toFixed(1) : 0;
              return (<>
                <div className="kpi-card">
                  <div className="kpi-label">Ingresos Totales</div>
                  <div className="kpi-value">{fmt(totalIngresos)}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Utilidad Total</div>
                  <div className="kpi-value" style={{color:'var(--green)'}}>{fmt(totalUtil)}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Margen Global</div>
                  <div className="kpi-value">{margen}%</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Unidades Vendidas</div>
                  <div className="kpi-value">{fmtNum(totalUndTotal)}</div>
                </div>
              </>);
            })()}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

            {/* Top 10 del mes */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:600 }}>🏆 Top 10 del Mes</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => abrirReporte('top10-mes')}>🖨️ PDF</button>
              </div>
              {datos.top10.length === 0
                ? <p style={{ color:'var(--text3)', fontSize:12, textAlign:'center', padding:20 }}>Sin ventas este mes</p>
                : datos.top10.map((p, i) => (
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                      <span><strong style={{ color:'var(--accent)' }}>#{i+1}</strong> {p.nombre}</span>
                      <span style={{ fontWeight:600 }}>{p.unidades} und</span>
                    </div>
                    <div style={{ background:'var(--bg3)', borderRadius:4, height:6, overflow:'hidden' }}>
                      <div style={{
                        width: `${(parseInt(p.unidades)/maxUnd*100).toFixed(0)}%`,
                        height:6, background:'var(--accent)', borderRadius:4
                      }} />
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Comparativo mensual */}
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h3 style={{ fontSize:14, fontWeight:600 }}>📅 Últimos 6 Meses</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => abrirReporte('comparativo')}>🖨️ PDF</button>
              </div>
              {datos.mensual.length === 0
                ? <p style={{ color:'var(--text3)', fontSize:12, textAlign:'center', padding:20 }}>Sin datos</p>
                : datos.mensual.map((m, i) => {
                  const prev = datos.mensual[i-1];
                  const delta = prev && prev.total > 0
                    ? ((parseFloat(m.total) - parseFloat(prev.total)) / parseFloat(prev.total) * 100).toFixed(1)
                    : null;
                  return (
                    <div key={i} style={{ marginBottom:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
                        <span style={{ fontWeight:500 }}>{nombreMes(m.mes)}</span>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          {delta !== null && (
                            <span style={{ fontSize:10, color: parseFloat(delta)>=0 ? 'var(--green)':'var(--red)' }}>
                              {parseFloat(delta)>=0 ? '▲' : '▼'}{Math.abs(delta)}%
                            </span>
                          )}
                          <span style={{ fontWeight:600 }}>{fmt(m.total)}</span>
                        </div>
                      </div>
                      <div style={{ background:'var(--bg3)', borderRadius:4, height:6, overflow:'hidden' }}>
                        <div style={{
                          width: `${(parseFloat(m.total)/maxVenta*100).toFixed(0)}%`,
                          height:6, background:'var(--green)', borderRadius:4
                        }} />
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* Rentabilidad por producto */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:600 }}>💰 Rentabilidad por Producto</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => abrirReporte('rentabilidad')}>🖨️ PDF completo</button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="table">
                <thead><tr>
                  <th>Producto</th>
                  <th style={{textAlign:'right'}}>P. Compra</th>
                  <th style={{textAlign:'right'}}>P. Venta</th>
                  <th style={{textAlign:'right'}}>Und. Vendidas</th>
                  <th style={{textAlign:'right'}}>Ingresos</th>
                  <th style={{textAlign:'right'}}>Utilidad</th>
                  <th style={{textAlign:'right'}}>Margen</th>
                </tr></thead>
                <tbody>
                  {datos.rentabilidad.map((p, i) => {
                    const margen = parseFloat(p.ingresos) > 0
                      ? (parseFloat(p.utilidad) / parseFloat(p.ingresos) * 100).toFixed(1)
                      : 0;
                    const cls = parseFloat(margen) >= 30 ? 'badge-green' : parseFloat(margen) >= 10 ? 'badge-amber' : 'badge-red';
                    const barW = (parseFloat(p.utilidad) / maxUtil * 100).toFixed(0);
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight:500 }}>{p.nombre}</td>
                        <td style={{textAlign:'right',fontSize:12}}>{fmt(p.precio_compra)}</td>
                        <td style={{textAlign:'right',fontSize:12}}>{fmt(p.precio_venta)}</td>
                        <td style={{textAlign:'right'}}>{parseInt(p.unidades)||0}</td>
                        <td style={{textAlign:'right'}}>{fmt(p.ingresos)}</td>
                        <td style={{textAlign:'right'}}>
                          <span style={{ fontWeight:600 }}>{fmt(p.utilidad)}</span>
                          <div style={{ background:'var(--bg3)', borderRadius:3, height:4, marginTop:3, overflow:'hidden' }}>
                            <div style={{ width:`${barW}%`, height:4, background:'var(--accent)', borderRadius:3 }} />
                          </div>
                        </td>
                        <td style={{textAlign:'right'}}>
                          <span className={`badge ${cls}`}>{margen}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
