import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmtDate } from '../utils/format';
import toast from 'react-hot-toast';

const empty = { nombre:'', email:'', telefono:'', direccion:'', nit:'' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(empty);
  const [editId, setEditId]     = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/clientes', { params: { search } }); setClientes(data); }
    catch { toast.error('Error cargando clientes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async e => {
    e.preventDefault();
    try {
      if (editId) { await api.put(`/clientes/${editId}`, form); toast.success('Cliente actualizado'); }
      else { await api.post('/clientes', form); toast.success('Cliente creado'); }
      setModal(false); setEditId(null); setForm(empty); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  return (
    <Layout title="Clientes">
      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Clientes</span>
          <div className="flex gap-8">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input className="input" placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
            <button className="btn btn-primary" onClick={()=>{setForm(empty);setEditId(null);setModal(true);}}>+ Nuevo cliente</button>
          </div>
        </div>
        {loading ? <div className="spinner"/> : (
          <table>
            <thead><tr><th>Nombre</th><th>NIT/Cédula</th><th>Email</th><th>Teléfono</th><th>Dirección</th><th>Registrado</th><th></th></tr></thead>
            <tbody>
              {clientes.length ? clientes.map(c=>(
                <tr key={c.id}>
                  <td><strong>{c.nombre}</strong></td>
                  <td className="mono" style={{color:'var(--text3)'}}>{c.nit||'—'}</td>
                  <td>{c.email||'—'}</td>
                  <td>{c.telefono||'—'}</td>
                  <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.direccion||'—'}</td>
                  <td style={{color:'var(--text3)',fontSize:12}}>{fmtDate(c.creado_en)}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={()=>{setForm(c);setEditId(c.id);setModal(true);}}>✏️</button></td>
                </tr>
              )) : <tr><td colSpan={7}><div className="empty-state">No hay clientes</div></td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editId?'Editar cliente':'Nuevo cliente'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(false)}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group span2"><label>Nombre completo *</label><input className="input" value={form.nombre} onChange={f('nombre')} required/></div>
                  <div className="input-group"><label>NIT / Cédula</label><input className="input" value={form.nit} onChange={f('nit')}/></div>
                  <div className="input-group"><label>Teléfono</label><input className="input" value={form.telefono} onChange={f('telefono')}/></div>
                  <div className="input-group span2"><label>Email</label><input className="input" type="email" value={form.email} onChange={f('email')}/></div>
                  <div className="input-group span2"><label>Dirección</label><input className="input" value={form.direccion} onChange={f('direccion')}/></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
