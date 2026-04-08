// ══════════════════════════════════════════════════════════════
//  Sucursales.jsx  ·  V5 – Gestión de sucursales (solo admin)
// ══════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt } from '../utils/format';
import toast from 'react-hot-toast';

const empty = { nombre: '', direccion: '', telefono: '', email: '', activo: 1 };

export default function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(empty);
  const [editId, setEditId]         = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [stockData, setStockData]   = useState([]);
  const [tab, setTab]               = useState('sucursales'); // sucursales | consolidado
  const [consolidado, setConsolidado] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/sucursales');
      setSucursales(data);
    } catch { toast.error('Error cargando sucursales'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadConsolidado = async () => {
    try {
      const { data } = await api.get('/sucursales/consolidado');
      setConsolidado(data);
    } catch { toast.error('Error cargando consolidado'); }
  };

  const handleTab = (t) => {
    setTab(t);
    if (t === 'consolidado') loadConsolidado();
  };

  const openNew  = () => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = s => { setForm({ ...s }); setEditId(s.id); setModal(true); };

  const save = async e => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/sucursales/${editId}`, form);
        toast.success('Sucursal actualizada');
      } else {
        await api.post('/sucursales', form);
        toast.success('Sucursal creada');
      }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error guardando'); }
  };

  const openStock = async (s) => {
    try {
      const { data } = await api.get('/sucursales/stock', { params: { sucursal_id: s.id } });
      setStockData(data);
      setStockModal(s);
    } catch { toast.error('Error cargando stock'); }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏪 Sucursales</h1>
          <p className="page-sub">Gestiona las sucursales del negocio</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nueva sucursal</button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        {[['sucursales','🏪 Sucursales'], ['consolidado','📊 Stock consolidado']].map(([k,l]) => (
          <button key={k} className={`tab ${tab===k?'active':''}`} onClick={() => handleTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'sucursales' && (
        loading ? <div className="spinner" style={{ margin: '60px auto' }} /> :
        <div className="grid-cards">
          {sucursales.map(s => (
            <div key={s.id} className="card" style={{ padding: 20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <h3 style={{ fontSize:15, fontWeight:600 }}>{s.nombre}</h3>
                    {s.es_principal ? <span className="badge badge-blue">Principal</span> : null}
                    <span className={`badge ${s.activo ? 'badge-green' : 'badge-red'}`}>
                      {s.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {s.direccion && <p style={{ fontSize:12, color:'var(--text2)', marginTop:4 }}>📍 {s.direccion}</p>}
                  {s.telefono  && <p style={{ fontSize:12, color:'var(--text2)' }}>📞 {s.telefono}</p>}
                  {s.email     && <p style={{ fontSize:12, color:'var(--text2)' }}>✉️ {s.email}</p>}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️ Editar</button>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <div style={{ textAlign:'center', flex:1, background:'var(--bg3)', borderRadius:8, padding:'10px 6px' }}>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--accent)' }}>{s.total_usuarios||0}</div>
                  <div style={{ fontSize:11, color:'var(--text2)' }}>Usuarios</div>
                </div>
                <div style={{ textAlign:'center', flex:1, background:'var(--bg3)', borderRadius:8, padding:'10px 6px' }}>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--green)' }}>{s.total_ventas||0}</div>
                  <div style={{ fontSize:11, color:'var(--text2)' }}>Ventas</div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => openStock(s)}>
                  📦 Ver stock
                </button>
              </div>
            </div>
          ))}
          {sucursales.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🏪</div>
              <p>No hay sucursales registradas</p>
            </div>
          )}
        </div>
      )}

      {tab === 'consolidado' && (
        <div className="card">
          <table className="table">
            <thead><tr>
              <th>Código</th><th>Producto</th><th>P. Venta</th>
              <th style={{textAlign:'right'}}>Stock Total</th>
              <th>Por Sucursal</th>
            </tr></thead>
            <tbody>
              {consolidado.map(p => {
                let porSuc = [];
                try { porSuc = typeof p.por_sucursal === 'string' ? JSON.parse(p.por_sucursal) : p.por_sucursal; } catch {}
                return (
                  <tr key={p.id}>
                    <td><code style={{fontSize:11}}>{p.codigo}</code></td>
                    <td>{p.nombre}</td>
                    <td>{fmt(p.precio_venta)}</td>
                    <td style={{textAlign:'right',fontWeight:600}}>{p.stock_total}</td>
                    <td>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {porSuc.map((ss, i) => (
                          <span key={i} style={{ fontSize:11, background:'var(--bg3)', borderRadius:6, padding:'2px 8px' }}>
                            {ss.sucursal}: <strong>{ss.stock}</strong>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {consolidado.length === 0 && (
                <tr><td colSpan={5} style={{textAlign:'center',padding:32,color:'var(--text3)'}}>Sin datos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Editar sucursal' : 'Nueva sucursal'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input className="input" value={form.nombre} required
                    onChange={e => setForm(f => ({...f, nombre: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input className="input" value={form.direccion||''}
                    onChange={e => setForm(f => ({...f, direccion: e.target.value}))} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input className="input" value={form.telefono||''}
                      onChange={e => setForm(f => ({...f, telefono: e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input className="input" type="email" value={form.email||''}
                      onChange={e => setForm(f => ({...f, email: e.target.value}))} />
                  </div>
                </div>
                {editId && (
                  <div className="form-group">
                    <label>Estado</label>
                    <select className="input" value={form.activo}
                      onChange={e => setForm(f => ({...f, activo: parseInt(e.target.value)}))}>
                      <option value={1}>Activa</option>
                      <option value={0}>Inactiva</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editId ? 'Guardar cambios' : 'Crear sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal stock de sucursal */}
      {stockModal && (
        <div className="modal-overlay" onClick={() => setStockModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📦 Stock – {stockModal.nombre}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setStockModal(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight:420, overflowY:'auto' }}>
              <table className="table">
                <thead><tr>
                  <th>Código</th><th>Producto</th>
                  <th style={{textAlign:'right'}}>Stock</th>
                  <th style={{textAlign:'right'}}>Mín.</th>
                  <th>Estado</th>
                </tr></thead>
                <tbody>
                  {stockData.map(s => (
                    <tr key={s.id}>
                      <td><code style={{fontSize:11}}>{s.codigo}</code></td>
                      <td>{s.nombre}</td>
                      <td style={{textAlign:'right',fontWeight:600}}>{s.stock}</td>
                      <td style={{textAlign:'right',color:'var(--text2)'}}>{s.stock_minimo}</td>
                      <td>
                        <span className={`badge ${s.stock <= 0 ? 'badge-red' : s.stock <= s.stock_minimo ? 'badge-amber' : 'badge-green'}`}>
                          {s.stock <= 0 ? 'Agotado' : s.stock <= s.stock_minimo ? 'Bajo' : 'OK'}
                        </span>
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
