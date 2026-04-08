// ══════════════════════════════════════════════════════════════
//  Descuentos.jsx  ·  V5 – Gestión de descuentos (solo admin)
// ══════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt } from '../utils/format';
import toast from 'react-hot-toast';

const empty = {
  codigo: '', nombre: '', tipo: 'porcentaje', valor: '',
  aplica_a: 'todos', referencia_id: '', activo: 1,
  fecha_inicio: '', fecha_fin: '', uso_maximo: ''
};

export default function Descuentos() {
  const [lista, setLista]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(empty);
  const [editId, setEditId]   = useState(null);
  const [filtro, setFiltro]   = useState('todos'); // todos | activos | inactivos

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/descuentos');
      setLista(data);
    } catch { toast.error('Error cargando descuentos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = lista.filter(d =>
    filtro === 'todos' ? true :
    filtro === 'activos' ? d.vigente :
    !d.vigente
  );

  const openNew  = () => { setForm(empty); setEditId(null); setModal(true); };
  const openEdit = d => {
    setForm({
      ...d,
      fecha_inicio: d.fecha_inicio ? d.fecha_inicio.split('T')[0] : '',
      fecha_fin:    d.fecha_fin    ? d.fecha_fin.split('T')[0]    : '',
      uso_maximo:   d.uso_maximo   ?? ''
    });
    setEditId(d.id); setModal(true);
  };

  const save = async e => {
    e.preventDefault();
    const payload = {
      ...form,
      valor:      parseFloat(form.valor),
      uso_maximo: form.uso_maximo ? parseInt(form.uso_maximo) : null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin:    form.fecha_fin    || null,
      referencia_id: form.referencia_id ? parseInt(form.referencia_id) : null,
    };
    try {
      if (editId) {
        await api.put(`/descuentos/${editId}`, payload);
        toast.success('Descuento actualizado');
      } else {
        await api.post('/descuentos', payload);
        toast.success('Descuento creado');
      }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error guardando'); }
  };

  const desactivar = async (d) => {
    if (!confirm(`¿Desactivar descuento "${d.nombre}"?`)) return;
    try {
      await api.delete(`/descuentos/${d.id}`);
      toast.success('Descuento desactivado');
      load();
    } catch { toast.error('Error'); }
  };

  const f = v => setForm(p => ({ ...p, ...v }));

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏷️ Descuentos y Promociones</h1>
          <p className="page-sub">Crea y gestiona códigos de descuento</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo descuento</button>
      </div>

      {/* Filtros */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['todos','Todos'], ['activos','Vigentes'], ['inactivos','No vigentes']].map(([k,l]) => (
          <button key={k} className={`btn btn-sm ${filtro===k?'btn-primary':'btn-ghost'}`}
            onClick={() => setFiltro(k)}>{l}</button>
        ))}
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)', alignSelf:'center' }}>
          {filtered.length} descuento{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading
        ? <div className="spinner" style={{ margin:'60px auto' }} />
        : (
          <div className="card" style={{ overflow:'auto' }}>
            <table className="table">
              <thead><tr>
                <th>Código</th><th>Nombre</th><th>Tipo</th><th>Valor</th>
                <th>Aplica a</th><th>Vigencia</th><th>Usos</th><th>Estado</th><th></th>
              </tr></thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td><code style={{ fontSize:11, background:'var(--bg3)', padding:'2px 6px', borderRadius:4 }}>{d.codigo}</code></td>
                    <td style={{ fontWeight:500 }}>{d.nombre}</td>
                    <td>
                      <span className={`badge ${d.tipo === 'porcentaje' ? 'badge-blue' : 'badge-purple'}`}>
                        {d.tipo === 'porcentaje' ? '%' : '$'} {d.tipo}
                      </span>
                    </td>
                    <td style={{ fontWeight:600 }}>
                      {d.tipo === 'porcentaje' ? `${d.valor}%` : fmt(d.valor)}
                    </td>
                    <td style={{ fontSize:12, color:'var(--text2)' }}>
                      {d.aplica_a === 'todos' ? 'Todos' :
                       d.aplica_a === 'categoria' ? `Categoría #${d.referencia_id}` :
                       d.aplica_a === 'producto'  ? `Producto #${d.referencia_id}` :
                       `Cliente #${d.referencia_id}`}
                    </td>
                    <td style={{ fontSize:11, color:'var(--text2)' }}>
                      {d.fecha_inicio ? d.fecha_inicio.split('T')[0] : '—'}
                      {d.fecha_fin ? ` → ${d.fecha_fin.split('T')[0]}` : ' → ∞'}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      {d.usos}{d.uso_maximo ? `/${d.uso_maximo}` : ''}
                    </td>
                    <td>
                      <span className={`badge ${d.vigente ? 'badge-green' : 'badge-red'}`}>
                        {d.vigente ? 'Vigente' : d.activo ? 'Expirado' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(d)} title="Editar">✏️</button>
                        {d.activo ? <button className="btn btn-ghost btn-sm btn-icon" onClick={() => desactivar(d)} title="Desactivar">🚫</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign:'center', padding:32, color:'var(--text3)' }}>
                    No hay descuentos{filtro !== 'todos' ? ' en este filtro' : ''}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      }

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editId ? 'Editar descuento' : 'Nuevo descuento'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div className="form-group">
                    <label>Código * <small style={{color:'var(--text3)'}}>Se guarda en mayúsculas</small></label>
                    <input className="input" value={form.codigo} required
                      style={{ textTransform:'uppercase', fontFamily:'var(--mono)' }}
                      onChange={e => f({ codigo: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input className="input" value={form.nombre} required
                      onChange={e => f({ nombre: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Tipo *</label>
                    <select className="input" value={form.tipo} onChange={e => f({ tipo: e.target.value })}>
                      <option value="porcentaje">Porcentaje (%)</option>
                      <option value="monto_fijo">Monto fijo ($)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valor * {form.tipo === 'porcentaje' ? '(%)' : '($)'}</label>
                    <input className="input" type="number" min="0" step="0.01" value={form.valor} required
                      onChange={e => f({ valor: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Aplica a</label>
                    <select className="input" value={form.aplica_a} onChange={e => f({ aplica_a: e.target.value })}>
                      <option value="todos">Todos los productos</option>
                      <option value="categoria">Categoría específica</option>
                      <option value="producto">Producto específico</option>
                      <option value="cliente">Cliente específico</option>
                    </select>
                  </div>
                  {form.aplica_a !== 'todos' && (
                    <div className="form-group">
                      <label>ID de referencia</label>
                      <input className="input" type="number" value={form.referencia_id}
                        placeholder="ID de categoría/producto/cliente"
                        onChange={e => f({ referencia_id: e.target.value })} />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Fecha inicio</label>
                    <input className="input" type="date" value={form.fecha_inicio}
                      onChange={e => f({ fecha_inicio: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Fecha fin</label>
                    <input className="input" type="date" value={form.fecha_fin}
                      onChange={e => f({ fecha_fin: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Uso máximo <small style={{color:'var(--text3)'}}>Vacío = ilimitado</small></label>
                    <input className="input" type="number" min="1" value={form.uso_maximo}
                      onChange={e => f({ uso_maximo: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <select className="input" value={form.activo} onChange={e => f({ activo: parseInt(e.target.value) })}>
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editId ? 'Guardar cambios' : 'Crear descuento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
