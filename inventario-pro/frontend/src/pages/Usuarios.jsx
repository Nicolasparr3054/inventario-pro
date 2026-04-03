import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { fmtDateTime } from '../utils/format';

const EMPTY = { nombre:'', email:'', password:'', rol:'cajero', activo:1 };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/usuarios'); setUsuarios(data); }
    catch { toast.error('Error cargando usuarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = u  => { setEditing(u); setForm({ nombre:u.nombre, email:u.email, password:'', rol:u.rol, activo:u.activo }); setModal(true); };

  const save = async () => {
    if (!form.nombre || !form.email) return toast.error('Nombre y email requeridos');
    if (!editing && !form.password)  return toast.error('La contraseña es requerida para nuevos usuarios');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/usuarios/${editing.id}`, form);
        toast.success('Usuario actualizado');
      } else {
        await api.post('/usuarios', form);
        toast.success('Usuario creado');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando usuario');
    } finally { setSaving(false); }
  };

  const desactivar = async u => {
    if (!confirm(`¿Desactivar a ${u.nombre}?`)) return;
    try {
      await api.delete(`/usuarios/${u.id}`);
      toast.success('Usuario desactivado');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const rolBadge = r => ({ admin:'badge-purple', cajero:'badge-blue', vendedor:'badge-green', almacenista:'badge-yellow' }[r] || 'badge-gray');

  return (
    <Layout title="Usuarios">
      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Gestión de Usuarios</span>
          <button className="btn btn-primary" onClick={openNew}>+ Nuevo usuario</button>
        </div>
        {loading ? <div className="spinner"/> : (
          <table>
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Creado</th><th></th></tr>
            </thead>
            <tbody>
              {usuarios.length ? usuarios.map(u=>(
                <tr key={u.id}>
                  <td style={{fontWeight:500}}>{u.nombre}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{u.email}</td>
                  <td><span className={`badge ${rolBadge(u.rol)}`}>{u.rol}</span></td>
                  <td><span className={`badge ${u.activo?'badge-green':'badge-gray'}`}>{u.activo?'Activo':'Inactivo'}</span></td>
                  <td style={{color:'var(--text3)',fontSize:12}}>{fmtDateTime(u.creado_en)}</td>
                  <td style={{display:'flex',gap:6}}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(u)}>Editar</button>
                    {u.activo===1 && (
                      <button className="btn btn-danger btn-sm" onClick={()=>desactivar(u)}>Desactivar</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6}><div className="empty-state">No hay usuarios registrados</div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
          <div className="modal" style={{maxWidth:440}}>
            <div className="modal-header">
              <h3>{editing?'Editar usuario':'Nuevo usuario'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div className="input-group">
                  <label>Nombre completo</label>
                  <input className="input" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Juan García"/>
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input className="input" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="juan@empresa.com"/>
                </div>
                <div className="input-group">
                  <label>{editing?'Nueva contraseña (dejar vacío para no cambiar)':'Contraseña'}</label>
                  <input className="input" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder={editing?'(sin cambios)':'Mínimo 6 caracteres'}/>
                </div>
                <div className="input-group">
                  <label>Rol</label>
                  <select className="input" value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))}>
                    <option value="cajero">Cajero — solo POS y sus ventas</option>
                    <option value="vendedor">Vendedor — POS, ventas y productos</option>
                    <option value="almacenista">Almacenista — inventario y productos</option>
                    <option value="admin">Administrador — acceso total</option>
                  </select>
                </div>
                {editing && (
                  <div className="input-group">
                    <label>Estado</label>
                    <select className="input" value={form.activo} onChange={e=>setForm(p=>({...p,activo:Number(e.target.value)}))}>
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving?'Guardando…':editing?'Actualizar':'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}