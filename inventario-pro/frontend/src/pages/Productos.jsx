import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum } from '../utils/format';
import toast from 'react-hot-toast';

const empty = { codigo:'', nombre:'', descripcion:'', categoria_id:'', proveedor_id:'',
                precio_compra:'', precio_venta:'', stock:'', stock_minimo:5, imagen_url:'' };

export default function Productos() {
  const [productos, setProductos]     = useState([]);
  const [categorias, setCategorias]   = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [catFilter, setCatFilter]     = useState('');
  const [modal, setModal]             = useState(false);
  const [form, setForm]               = useState(empty);
  const [editId, setEditId]           = useState(null);
  const [stockModal, setStockModal]   = useState(null);
  const [ajuste, setAjuste]           = useState({ cantidad:'', motivo:'' });
  const [imgPreview, setImgPreview]   = useState(''); // V3: preview imagen

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c, pr] = await Promise.all([
        api.get('/productos', { params: { search, categoria_id: catFilter } }),
        api.get('/categorias'),
        api.get('/proveedores'),
      ]);
      setProductos(p.data); setCategorias(c.data); setProveedores(pr.data);
    } catch { toast.error('Error cargando productos'); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  const openNew  = () => {
    setForm(empty);
    setEditId(null);
    setImgPreview('');
    setModal(true);
    // V6: auto-generar código al crear nuevo producto
    setForm(prev => ({ ...prev, codigo: 'PROD-' + Date.now().toString().slice(-8) }));
  };
  const openEdit = p => {
    setForm({ ...p, categoria_id: p.categoria_id||'', proveedor_id: p.proveedor_id||'' });
    setEditId(p.id);
    setImgPreview(p.imagen_url||'');
    setModal(true);
  };
  const closeModal = () => { setModal(false); setEditId(null); setImgPreview(''); };

  const save = async e => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/productos/${editId}`, form);
        toast.success('Producto actualizado');
      } else {
        await api.post('/productos', form);
        toast.success('Producto creado');
      }
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error guardando'); }
  };

  const saveAjuste = async () => {
    if (!ajuste.cantidad) return toast.error('Ingresa cantidad');
    try {
      await api.patch(`/productos/${stockModal.id}/stock`, ajuste);
      toast.success('Stock ajustado');
      setStockModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const f = k => e => {
    const val = e.target.value;
    setForm(p=>({...p,[k]:val}));
    if (k === 'imagen_url') setImgPreview(val);
  };

  // V3: cargar imagen desde archivo local (convierte a base64)
  const handleImageFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) return toast.error('La imagen no debe superar 500KB');
    const reader = new FileReader();
    reader.onload = ev => {
      setForm(p=>({...p, imagen_url: ev.target.result}));
      setImgPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Layout title="Productos">
      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Catálogo de Productos</span>
          <div className="flex gap-8" style={{flexWrap:'wrap'}}>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input className="input" placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:180}}/>
            </div>
            <select className="input" value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{width:150}}>
              <option value="">Todas las cat.</option>
              {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openNew}>+ Nuevo producto</button>
          </div>
        </div>
        {loading ? <div className="spinner"/> : (
          <table>
            <thead><tr><th>Img</th><th>Código</th><th>Producto</th><th>Categoría</th><th>Compra</th><th>Venta</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {productos.length ? productos.map(p=>(
                <tr key={p.id}>
                  {/* V3: miniatura de imagen */}
                  <td style={{width:44,padding:'8px 12px'}}>
                    {p.imagen_url
                      ? <img src={p.imagen_url} alt={p.nombre} style={{width:36,height:36,objectFit:'cover',borderRadius:6,border:'0.5px solid var(--border)'}}/>
                      : <div style={{width:36,height:36,borderRadius:6,background:'var(--bg-page)',border:'0.5px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📦</div>
                    }
                  </td>
                  <td><span className="mono" style={{fontSize:12,color:'var(--text3)'}}>{p.codigo}</span></td>
                  <td>
                    <strong style={{display:'block'}}>{p.nombre}</strong>
                    {p.descripcion && <span style={{fontSize:12,color:'var(--text3)'}}>{p.descripcion.slice(0,40)}{p.descripcion.length>40?'…':''}</span>}
                  </td>
                  <td>
                    {p.categoria_nombre
                      ? <span className="badge" style={{background:p.categoria_color+'22',color:p.categoria_color}}>{p.categoria_nombre}</span>
                      : <span style={{color:'var(--text3)'}}>—</span>}
                  </td>
                  <td className="mono">{fmt(p.precio_compra)}</td>
                  <td className="mono" style={{color:'var(--green)',fontWeight:600}}>{fmt(p.precio_venta)}</td>
                  <td>
                    <span className={`badge ${p.stock<=0?'badge-red':p.stock<=p.stock_minimo?'badge-yellow':'badge-green'}`}>
                      {fmtNum(p.stock)} uds
                    </span>
                  </td>
                  <td><span className={`badge ${p.activo?'badge-green':'badge-gray'}`}>{p.activo?'Activo':'Inactivo'}</span></td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(p)}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={()=>{setStockModal(p);setAjuste({cantidad:'',motivo:''});}}>📊</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={9}><div className="empty-state">No se encontraron productos</div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal producto */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&closeModal()}>
          <div className="modal" style={{maxWidth:560}}>
            <div className="modal-header">
              <h3>{editId ? 'Editar producto' : 'Nuevo producto'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="input-group"><label>Código *</label>
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <input className="input" value={form.codigo} onChange={f('codigo')} required disabled={!!editId}/>
                      {!editId && (
                        <button type="button" className="btn btn-sm" title="Generar nuevo código"
                          onClick={() => setForm(prev => ({ ...prev, codigo: 'PROD-' + Date.now().toString().slice(-8) }))}>
                          🔄
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="input-group"><label>Nombre *</label><input className="input" value={form.nombre} onChange={f('nombre')} required/></div>
                  <div className="input-group full"><label>Descripción</label><input className="input" value={form.descripcion} onChange={f('descripcion')}/></div>
                  <div className="input-group"><label>Categoría</label>
                    <select className="input" value={form.categoria_id} onChange={f('categoria_id')}>
                      <option value="">Sin categoría</option>
                      {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="input-group"><label>Proveedor</label>
                    <select className="input" value={form.proveedor_id} onChange={f('proveedor_id')}>
                      <option value="">Sin proveedor</option>
                      {proveedores.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="input-group"><label>Precio compra</label><input className="input" type="number" min="0" step="0.01" value={form.precio_compra} onChange={f('precio_compra')}/></div>
                  <div className="input-group"><label>Precio venta</label><input className="input" type="number" min="0" step="0.01" value={form.precio_venta} onChange={f('precio_venta')}/></div>
                  {!editId && <div className="input-group"><label>Stock inicial</label><input className="input" type="number" min="0" value={form.stock} onChange={f('stock')}/></div>}
                  <div className="input-group"><label>Stock mínimo</label><input className="input" type="number" min="0" value={form.stock_minimo} onChange={f('stock_minimo')}/></div>
                  {editId && (
                    <div className="input-group">
                      <label>Estado</label>
                      <select className="input" value={form.activo} onChange={f('activo')}>
                        <option value={1}>Activo</option>
                        <option value={0}>Inactivo</option>
                      </select>
                    </div>
                  )}

                  {/* V3: imagen */}
                  <div className="input-group full">
                    <label>Imagen del producto</label>
                    <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                        <input className="input" value={form.imagen_url||''} onChange={f('imagen_url')} placeholder="URL de imagen (https://...)"/>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontSize:11,color:'var(--text3)'}}>o subir archivo</span>
                          <input type="file" accept="image/*" onChange={handleImageFile} style={{fontSize:11,color:'var(--text2)'}}/>
                        </div>
                      </div>
                      {imgPreview && (
                        <img src={imgPreview} alt="preview" style={{width:64,height:64,objectFit:'cover',borderRadius:8,border:'0.5px solid var(--border)',flexShrink:0}}
                          onError={()=>setImgPreview('')}/>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ajuste stock */}
      {stockModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setStockModal(null)}>
          <div className="modal" style={{maxWidth:380}}>
            <div className="modal-header">
              <h3>Ajustar Stock</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setStockModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{color:'var(--text2)',fontSize:13,marginBottom:14}}>
                <strong>{stockModal.nombre}</strong> — Stock actual: <span className="mono">{fmtNum(stockModal.stock)}</span>
              </p>
              <div className="input-group" style={{marginBottom:10}}>
                <label>Cantidad (positivo = entrada, negativo = salida)</label>
                <input className="input" type="number" value={ajuste.cantidad} onChange={e=>setAjuste(p=>({...p,cantidad:e.target.value}))} placeholder="Ej: 10 o -5"/>
              </div>
              <div className="input-group">
                <label>Motivo</label>
                <input className="input" value={ajuste.motivo} onChange={e=>setAjuste(p=>({...p,motivo:e.target.value}))} placeholder="Ej: Compra a proveedor"/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setStockModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveAjuste}>Aplicar ajuste</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}