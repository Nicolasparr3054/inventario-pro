import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum, fmtDateTime } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Ventas() {
  const { user } = useAuth();
  const [ventas, setVentas]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail]   = useState(null);
  const [filters, setFilters] = useState({ desde:'', hasta:'', estado:'' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ventas', { params: filters });
      setVentas(data);
    } catch { toast.error('Error cargando ventas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async id => {
    try {
      const { data } = await api.get(`/ventas/${id}`);
      setDetail(data);
    } catch { toast.error('Error cargando detalle'); }
  };

  const exportarCSV = () => {
    const params = new URLSearchParams(filters).toString();
    window.location.href = `/api/reportes/ventas/csv?${params}`;
  };

  const estadoBadge = e => ({ completada:'badge-green', pendiente:'badge-yellow', cancelada:'badge-red' }[e] || 'badge-gray');

  return (
    <Layout title="Ventas">
      <div className="table-wrapper" style={{marginBottom:20}}>
        <div className="table-header">
          <span className="table-title">Registro de Ventas</span>
          <div className="flex gap-8" style={{flexWrap:'wrap'}}>
            <input className="input" type="date" value={filters.desde}
              onChange={e=>setFilters(p=>({...p,desde:e.target.value}))} style={{width:140}}/>
            <input className="input" type="date" value={filters.hasta}
              onChange={e=>setFilters(p=>({...p,hasta:e.target.value}))} style={{width:140}}/>
            <select className="input" value={filters.estado}
              onChange={e=>setFilters(p=>({...p,estado:e.target.value}))} style={{width:130}}>
              <option value="">Todos</option>
              <option value="completada">Completada</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <button className="btn btn-secondary" onClick={load}>Filtrar</button>
            {user?.rol === 'admin' && (
              <button className="btn btn-ghost" onClick={exportarCSV} title="Exportar CSV">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Exportar
              </button>
            )}
          </div>
        </div>
        {loading ? <div className="spinner"/> : (
          <table>
            <thead>
              <tr>
                <th>N° Venta</th><th>Cliente</th>
                {user?.rol === 'admin' && <th>Vendedor</th>}
                <th>Items</th><th>Subtotal</th><th>Descuento</th><th>Total</th>
                <th>Método</th><th>Estado</th><th>Fecha</th><th></th>
              </tr>
            </thead>
            <tbody>
              {ventas.length ? ventas.map(v=>(
                <tr key={v.id}>
                  <td><span className="mono" style={{fontSize:12,color:'var(--accent)'}}>{v.numero_venta}</span></td>
                  <td>{v.cliente_nombre || <span style={{color:'var(--text3)'}}>General</span>}</td>
                  {user?.rol === 'admin' && <td style={{color:'var(--text2)',fontSize:12}}>{v.vendedor_nombre || '-'}</td>}
                  <td className="mono">{v.total_items}</td>
                  <td className="mono">{fmt(v.subtotal)}</td>
                  <td className="mono" style={{color:'var(--green)'}}>{v.descuento>0?`-${fmt(v.descuento)}`:'-'}</td>
                  <td className="mono" style={{fontWeight:700,color:'var(--text)'}}>{fmt(v.total)}</td>
                  <td><span className="badge badge-blue">{v.metodo_pago}</span></td>
                  <td><span className={`badge ${estadoBadge(v.estado)}`}>{v.estado}</span></td>
                  <td style={{color:'var(--text3)',fontSize:12}}>{fmtDateTime(v.creado_en)}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={()=>openDetail(v.id)}>Ver</button></td>
                </tr>
              )) : (
                <tr><td colSpan={user?.rol==='admin'?11:10}><div className="empty-state">No hay ventas registradas</div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {detail && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setDetail(null)}>
          <div className="modal" style={{maxWidth:640}}>
            <div className="modal-header">
              <h3>Venta <span className="mono" style={{color:'var(--accent)'}}>{detail.numero_venta}</span></h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                <div><span style={{fontSize:11,color:'var(--text3)'}}>Cliente</span><p style={{fontWeight:600}}>{detail.cliente_nombre||'General'}</p></div>
                <div><span style={{fontSize:11,color:'var(--text3)'}}>Fecha</span><p>{fmtDateTime(detail.creado_en)}</p></div>
                <div><span style={{fontSize:11,color:'var(--text3)'}}>Método de pago</span><p>{detail.metodo_pago}</p></div>
                <div><span style={{fontSize:11,color:'var(--text3)'}}>Vendedor</span><p>{detail.vendedor_nombre||'-'}</p></div>
                <div><span style={{fontSize:11,color:'var(--text3)'}}>Estado</span><p><span className={`badge ${estadoBadge(detail.estado)}`}>{detail.estado}</span></p></div>
              </div>
              <table style={{marginBottom:16}}>
                <thead><tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detail.detalles?.map(d=>(
                    <tr key={d.id}>
                      <td><strong>{d.producto_nombre}</strong><br/><span style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)'}}>{d.producto_codigo}</span></td>
                      <td className="mono">{d.cantidad}</td>
                      <td className="mono">{fmt(d.precio_unit)}</td>
                      <td className="mono" style={{fontWeight:600}}>{fmt(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{background:'var(--bg-page)',borderRadius:8,padding:'14px 16px'}}>
                <div className="cart-total-row"><span>Subtotal</span><span className="mono">{fmt(detail.subtotal)}</span></div>
                {detail.impuesto>0 && <div className="cart-total-row"><span>Impuesto</span><span className="mono">{fmt(detail.impuesto)}</span></div>}
                {detail.descuento>0 && <div className="cart-total-row"><span style={{color:'var(--green)'}}>Descuento</span><span className="mono text-green">−{fmt(detail.descuento)}</span></div>}
                <div className="cart-total-row total"><span>TOTAL</span><span>{fmt(detail.total)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}