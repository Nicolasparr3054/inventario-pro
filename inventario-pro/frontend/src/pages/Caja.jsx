// ══════════════════════════════════════════════════════════════
//  Caja.jsx  ·  V5 – Control de caja / turnos
// ══════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Caja() {
  const { user } = useAuth();
  const isAdmin  = user?.rol === 'admin';

  const [turnoActivo, setTurnoActivo]   = useState(null);
  const [turnos, setTurnos]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('turno'); // turno | historial
  const [abrirModal, setAbrirModal]     = useState(false);
  const [cerrarModal, setCerrarModal]   = useState(false);
  const [movModal, setMovModal]         = useState(false);
  const [resumenModal, setResumenModal] = useState(null);
  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinal, setMontoFinal]     = useState('');
  const [notasCierre, setNotasCierre]   = useState('');
  const [movForm, setMovForm]           = useState({ tipo:'ingreso', monto:'', descripcion:'' });

  const loadTurno = useCallback(async () => {
    try {
      const { data } = await api.get('/caja/turno-activo');
      setTurnoActivo(data);
    } catch { setTurnoActivo(null); }
  }, []);

  const loadTurnos = useCallback(async () => {
    try {
      const { data } = await api.get('/caja/turnos', { params: { limite: 30 } });
      setTurnos(data);
    } catch { toast.error('Error cargando historial'); }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadTurno(), loadTurnos()]);
    setLoading(false);
  }, [loadTurno, loadTurnos]);

  useEffect(() => { load(); }, [load]);

  const abrirTurno = async e => {
    e.preventDefault();
    try {
      await api.post('/caja/abrir', { monto_inicial: parseFloat(montoInicial) });
      toast.success('Turno abierto');
      setAbrirModal(false); setMontoInicial(''); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const cerrarTurno = async e => {
    e.preventDefault();
    try {
      const { data } = await api.patch(`/caja/turnos/${turnoActivo.id}/cerrar`, {
        monto_final: parseFloat(montoFinal), notas_cierre: notasCierre
      });
      toast.success(`Turno cerrado. Diferencia: ${fmt(data.diferencia)}`);
      setCerrarModal(false); setMontoFinal(''); setNotasCierre(''); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const addMovimiento = async e => {
    e.preventDefault();
    try {
      await api.post(`/caja/turnos/${turnoActivo.id}/movimientos`, movForm);
      toast.success('Movimiento registrado');
      setMovModal(false); setMovForm({ tipo:'ingreso', monto:'', descripcion:'' }); loadTurno();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const verResumen = async (t) => {
    try {
      const { data } = await api.get(`/caja/turnos/${t.id}/resumen`);
      setResumenModal(data);
    } catch { toast.error('Error'); }
  };

  const tipoColor = tipo => ({
    ingreso:    'var(--green)',
    egreso:     'var(--red)',
    venta:      'var(--accent)',
    devolucion: 'var(--amber)',
  }[tipo] || 'var(--text)');

  const tipoIcon = tipo => ({ ingreso:'⬆️', egreso:'⬇️', venta:'💰', devolucion:'↩️' }[tipo] || '📝');

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏧 Caja</h1>
          <p className="page-sub">Control de turnos y movimientos de efectivo</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom:20 }}>
        {[['turno','💼 Mi turno'], ['historial','📋 Historial']].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {loading && <div className="spinner" style={{ margin:'60px auto' }} />}

      {!loading && tab === 'turno' && (
        <>
          {!turnoActivo ? (
            <div className="empty-state">
              <div className="empty-icon">🔒</div>
              <p style={{ fontWeight:600, fontSize:16 }}>No hay turno abierto</p>
              <p style={{ color:'var(--text3)', marginTop:6 }}>Abre un turno para comenzar a registrar ventas</p>
              <button className="btn btn-primary" style={{ marginTop:20 }} onClick={() => setAbrirModal(true)}>
                🔓 Abrir turno
              </button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:20 }}>
              {/* Info turno */}
              <div>
                <div className="card" style={{ padding:20, marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <h3 style={{ fontSize:14, fontWeight:600 }}>Turno activo</h3>
                    <span className="badge badge-green">🟢 Abierto</span>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>
                    👤 {turnoActivo.usuario_nombre || user?.nombre}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>
                    🕐 Apertura: {new Date(turnoActivo.creado_en).toLocaleString('es-CO')}
                  </div>
                  {turnoActivo.sucursal_nombre && (
                    <div style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>
                      🏪 {turnoActivo.sucursal_nombre}
                    </div>
                  )}
                  <div style={{ background:'var(--bg3)', borderRadius:8, padding:'12px 16px', marginTop:12 }}>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Monto inicial</div>
                    <div style={{ fontSize:22, fontWeight:700, color:'var(--accent)' }}>
                      {fmt(turnoActivo.monto_inicial)}
                    </div>
                  </div>
                  {/* Resumen rápido */}
                  {turnoActivo.movimientos && (() => {
                    const movs = turnoActivo.movimientos;
                    const ventas   = movs.filter(m => m.tipo==='venta').reduce((s,m) => s+parseFloat(m.monto),0);
                    const ingresos = movs.filter(m => m.tipo==='ingreso').reduce((s,m) => s+parseFloat(m.monto),0);
                    const egresos  = movs.filter(m => m.tipo==='egreso').reduce((s,m) => s+parseFloat(m.monto),0);
                    const devoluc  = movs.filter(m => m.tipo==='devolucion').reduce((s,m) => s+parseFloat(m.monto),0);
                    return (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:12 }}>
                        {[['💰 Ventas', ventas,'var(--accent)'],['⬆️ Ingresos',ingresos,'var(--green)'],
                          ['⬇️ Egresos',egresos,'var(--red)'],['↩️ Devoluc.',devoluc,'var(--amber)']].map(([l,v,c]) => (
                          <div key={l} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px' }}>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>{l}</div>
                            <div style={{ fontSize:15, fontWeight:700, color:c }}>{fmt(v)}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div style={{ display:'flex', gap:8, marginTop:16 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => setMovModal(true)}>
                      + Movimiento
                    </button>
                    <button className="btn btn-primary btn-sm" style={{ flex:1 }} onClick={() => setCerrarModal(true)}>
                      🔒 Cerrar turno
                    </button>
                  </div>
                </div>
              </div>

              {/* Movimientos */}
              <div className="card" style={{ maxHeight:500, overflow:'auto' }}>
                <h3 style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Movimientos del turno</h3>
                {!turnoActivo.movimientos?.length
                  ? <p style={{ color:'var(--text3)', fontSize:12, textAlign:'center', padding:20 }}>Sin movimientos aún</p>
                  : turnoActivo.movimientos.map((m, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                      <div>
                        <span style={{ marginRight:8 }}>{tipoIcon(m.tipo)}</span>
                        <span style={{ fontWeight:500 }}>{m.descripcion || m.tipo}</span>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>
                          {new Date(m.creado_en).toLocaleTimeString('es-CO')}
                        </div>
                      </div>
                      <span style={{ fontWeight:700, color:tipoColor(m.tipo) }}>
                        {['egreso','devolucion'].includes(m.tipo) ? '-' : '+'}{fmt(m.monto)}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </>
      )}

      {!loading && tab === 'historial' && (
        <div className="card" style={{ overflow:'auto' }}>
          <table className="table">
            <thead><tr>
              <th>ID</th><th>Usuario</th><th>Sucursal</th><th>Apertura</th>
              <th style={{textAlign:'right'}}>Monto inicial</th>
              <th style={{textAlign:'right'}}>Monto final</th>
              <th style={{textAlign:'right'}}>Diferencia</th>
              <th>Estado</th><th></th>
            </tr></thead>
            <tbody>
              {turnos.map(t => (
                <tr key={t.id}>
                  <td style={{color:'var(--text3)',fontSize:12}}>#{t.id}</td>
                  <td style={{fontWeight:500}}>{t.usuario_nombre}</td>
                  <td style={{fontSize:12,color:'var(--text2)'}}>{t.sucursal_nombre||'—'}</td>
                  <td style={{fontSize:12}}>{new Date(t.creado_en).toLocaleString('es-CO')}</td>
                  <td style={{textAlign:'right'}}>{fmt(t.monto_inicial)}</td>
                  <td style={{textAlign:'right'}}>{t.monto_final != null ? fmt(t.monto_final) : '—'}</td>
                  <td style={{textAlign:'right'}}>
                    {t.diferencia != null
                      ? <span style={{ fontWeight:600, color: parseFloat(t.diferencia) < 0 ? 'var(--red)' : parseFloat(t.diferencia) > 0 ? 'var(--green)' : 'var(--text)' }}>
                          {parseFloat(t.diferencia) >= 0 ? '+' : ''}{fmt(t.diferencia)}
                        </span>
                      : '—'
                    }
                  </td>
                  <td><span className={`badge ${t.estado==='abierto'?'badge-green':'badge-red'}`}>{t.estado}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => verResumen(t)}>Ver</button>
                  </td>
                </tr>
              ))}
              {turnos.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:32, color:'var(--text3)' }}>Sin turnos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal abrir turno */}
      {abrirModal && (
        <div className="modal-overlay" onClick={() => setAbrirModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔓 Abrir turno de caja</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setAbrirModal(false)}>✕</button>
            </div>
            <form onSubmit={abrirTurno}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Monto inicial en caja ($) *</label>
                  <input className="input" type="number" min="0" step="0.01" value={montoInicial}
                    placeholder="Ej: 50000" required onChange={e => setMontoInicial(e.target.value)} />
                  <small style={{ color:'var(--text3)' }}>El efectivo físico con el que inicia el turno</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setAbrirModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Abrir turno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal cerrar turno */}
      {cerrarModal && (
        <div className="modal-overlay" onClick={() => setCerrarModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔒 Cerrar turno de caja</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setCerrarModal(false)}>✕</button>
            </div>
            <form onSubmit={cerrarTurno}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Monto contado en caja ($) *</label>
                  <input className="input" type="number" min="0" step="0.01" value={montoFinal}
                    placeholder="Efectivo físico en caja" required onChange={e => setMontoFinal(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Notas de cierre</label>
                  <textarea className="input" rows={3} value={notasCierre}
                    placeholder="Observaciones del cierre..."
                    onChange={e => setNotasCierre(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setCerrarModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Cerrar turno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal movimiento */}
      {movModal && (
        <div className="modal-overlay" onClick={() => setMovModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💵 Registrar movimiento</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setMovModal(false)}>✕</button>
            </div>
            <form onSubmit={addMovimiento}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tipo *</label>
                  <select className="input" value={movForm.tipo}
                    onChange={e => setMovForm(p => ({...p, tipo: e.target.value}))}>
                    <option value="ingreso">⬆️ Ingreso</option>
                    <option value="egreso">⬇️ Egreso</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Monto ($) *</label>
                  <input className="input" type="number" min="0.01" step="0.01" value={movForm.monto}
                    required onChange={e => setMovForm(p => ({...p, monto: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input className="input" value={movForm.descripcion}
                    placeholder="Ej: Pago de servicios, abono de caja..."
                    onChange={e => setMovForm(p => ({...p, descripcion: e.target.value}))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setMovModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal resumen turno */}
      {resumenModal && (
        <div className="modal-overlay" onClick={() => setResumenModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Resumen turno #{resumenModal.id}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setResumenModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:20 }}>
                {[
                  ['Monto inicial', fmt(resumenModal.monto_inicial), 'var(--text)'],
                  ['Total ventas', fmt(resumenModal.resumen?.total_ventas), 'var(--accent)'],
                  ['Monto esperado', fmt(resumenModal.monto_esperado), 'var(--text)'],
                  ['Diferencia', fmt(resumenModal.diferencia),
                    parseFloat(resumenModal.diferencia||0) < 0 ? 'var(--red)' :
                    parseFloat(resumenModal.diferencia||0) > 0 ? 'var(--green)' : 'var(--text)'],
                ].map(([l,v,c]) => (
                  <div key={l} style={{ background:'var(--bg3)', borderRadius:8, padding:'12px 14px' }}>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{l}</div>
                    <div style={{ fontSize:16, fontWeight:700, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
              <table className="table">
                <thead><tr><th>Tipo</th><th>Descripción</th><th style={{textAlign:'right'}}>Monto</th><th>Hora</th></tr></thead>
                <tbody>
                  {resumenModal.movimientos?.map((m, i) => (
                    <tr key={i}>
                      <td><span className="badge" style={{ background:'var(--bg3)', color:tipoColor(m.tipo) }}>
                        {tipoIcon(m.tipo)} {m.tipo}
                      </span></td>
                      <td style={{fontSize:12}}>{m.descripcion||'—'}</td>
                      <td style={{textAlign:'right',fontWeight:600,color:tipoColor(m.tipo)}}>
                        {['egreso','devolucion'].includes(m.tipo) ? '-' : '+'}{fmt(m.monto)}
                      </td>
                      <td style={{fontSize:11,color:'var(--text3)'}}>
                        {new Date(m.creado_en).toLocaleTimeString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
