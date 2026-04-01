// ── Categorias ────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

export function Categorias() {
  const [cats, setCats]   = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ nombre:'', descripcion:'', color:'#6366f1' });

  const load = () => api.get('/categorias').then(r=>setCats(r.data)).catch(()=>toast.error('Error'));
  useEffect(()=>{load();},[]);

  const save = async e => {
    e.preventDefault();
    try { await api.post('/categorias', form); toast.success('Categoría creada'); setModal(false); setForm({nombre:'',descripcion:'',color:'#6366f1'}); load(); }
    catch (err) { toast.error(err.response?.data?.error||'Error'); }
  };

  return (
    <Layout title="Categorías">
      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Categorías de Productos</span>
          <button className="btn btn-primary" onClick={()=>setModal(true)}>+ Nueva categoría</button>
        </div>
        <table>
          <thead><tr><th>Color</th><th>Nombre</th><th>Descripción</th><th>Productos</th></tr></thead>
          <tbody>
            {cats.map(c=>(
              <tr key={c.id}>
                <td><div style={{width:24,height:24,borderRadius:6,background:c.color}}/></td>
                <td><strong>{c.nombre}</strong></td>
                <td style={{color:'var(--text2)'}}>{c.descripcion||'—'}</td>
                <td><span className="badge badge-blue">{c.total_productos} productos</span></td>
              </tr>
            ))}
            {!cats.length && <tr><td colSpan={4}><div className="empty-state">Sin categorías</div></td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal" style={{maxWidth:400}}>
            <div className="modal-header"><h3>Nueva categoría</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(false)}>✕</button></div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="input-group"><label>Nombre *</label><input className="input" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} required/></div>
                <div className="input-group"><label>Descripción</label><input className="input" value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))}/></div>
                <div className="input-group"><label>Color</label><input className="input" type="color" value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} style={{height:42,cursor:'pointer'}}/></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary">Crear</button></div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ── Proveedores ───────────────────────────────────────────────
export function Proveedores() {
  const [provs, setProvs] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ nombre:'', contacto:'', telefono:'', email:'', direccion:'' });

  const load = () => api.get('/proveedores').then(r=>setProvs(r.data)).catch(()=>toast.error('Error'));
  useEffect(()=>{load();},[]);

  const save = async e => {
    e.preventDefault();
    try { await api.post('/proveedores', form); toast.success('Proveedor creado'); setModal(false); setForm({nombre:'',contacto:'',telefono:'',email:'',direccion:''}); load(); }
    catch (err) { toast.error(err.response?.data?.error||'Error'); }
  };

  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  return (
    <Layout title="Proveedores">
      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Proveedores</span>
          <button className="btn btn-primary" onClick={()=>setModal(true)}>+ Nuevo proveedor</button>
        </div>
        <table>
          <thead><tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Productos</th></tr></thead>
          <tbody>
            {provs.map(p=>(
              <tr key={p.id}>
                <td><strong>{p.nombre}</strong></td>
                <td>{p.contacto||'—'}</td>
                <td>{p.telefono||'—'}</td>
                <td>{p.email||'—'}</td>
                <td><span className="badge badge-green">{p.total_productos} productos</span></td>
              </tr>
            ))}
            {!provs.length && <tr><td colSpan={5}><div className="empty-state">Sin proveedores</div></td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal">
            <div className="modal-header"><h3>Nuevo proveedor</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(false)}>✕</button></div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group span2"><label>Nombre empresa *</label><input className="input" value={form.nombre} onChange={f('nombre')} required/></div>
                  <div className="input-group"><label>Persona de contacto</label><input className="input" value={form.contacto} onChange={f('contacto')}/></div>
                  <div className="input-group"><label>Teléfono</label><input className="input" value={form.telefono} onChange={f('telefono')}/></div>
                  <div className="input-group span2"><label>Email</label><input className="input" type="email" value={form.email} onChange={f('email')}/></div>
                  <div className="input-group span2"><label>Dirección</label><input className="input" value={form.direccion} onChange={f('direccion')}/></div>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary">Guardar</button></div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
