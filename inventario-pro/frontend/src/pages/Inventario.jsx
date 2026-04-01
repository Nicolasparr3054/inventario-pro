import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum, fmtDateTime } from '../utils/format';
import toast from 'react-hot-toast';

export default function Inventario() {
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [stockModal, setStockModal] = useState(null);
  const [ajuste, setAjuste]     = useState({ cantidad:'', motivo:'' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/productos/stock-bajo');
      setLowStock(data);
    } catch { toast.error('Error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const saveAjuste = async () => {
    if (!ajuste.cantidad) return toast.error('Cantidad requerida');
    try {
      await api.patch(`/productos/${stockModal.id}/stock`, ajuste);
      toast.success('Stock actualizado');
      setStockModal(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <Layout title="Inventario">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:16,fontWeight:700}}>Productos con stock bajo</h2>
          <p style={{color:'var(--text2)',fontSize:13,marginTop:2}}>Productos que requieren reabastecimiento</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>↻ Actualizar</button>
      </div>

      {loading ? <div className="spinner"/> : (
        lowStock.length === 0 ? (
          <div className="table-wrapper">
            <div className="empty-state" style={{padding:60}}>
              <div style={{fontSize:48,marginBottom:12}}>✅</div>
              <p style={{fontSize:15,fontWeight:600,color:'var(--green)'}}>Todo el inventario está bien</p>
              <p style={{fontSize:13,marginTop:4}}>Ningún producto tiene stock bajo en este momento</p>
            </div>
          </div>
        ) : (
          <div className="table-wrapper">
            <div className="table-header">
              <span className="table-title">⚠️ {lowStock.length} productos necesitan atención</span>
            </div>
            <table>
              <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Stock actual</th><th>Stock mínimo</th><th>Diferencia</th><th>Precio venta</th><th>Acciones</th></tr></thead>
              <tbody>
                {lowStock.map(p=>(
                  <tr key={p.id}>
                    <td><span className="mono" style={{fontSize:12,color:'var(--text3)'}}>{p.codigo}</span></td>
                    <td><strong>{p.nombre}</strong></td>
                    <td>{p.categoria_nombre ? <span className="badge badge-blue">{p.categoria_nombre}</span> : '—'}</td>
                    <td>
                      <span className={`badge mono ${p.stock<=0?'badge-red':'badge-yellow'}`} style={{fontSize:13,fontWeight:700}}>
                        {p.stock<=0?'SIN STOCK':fmtNum(p.stock)}
                      </span>
                    </td>
                    <td className="mono">{fmtNum(p.stock_minimo)}</td>
                    <td><span style={{color:'var(--red)',fontWeight:700,fontFamily:'var(--mono)'}}>{fmtNum(p.stock - p.stock_minimo)}</span></td>
                    <td className="mono" style={{color:'var(--green)'}}>{fmt(p.precio_venta)}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={()=>{setStockModal(p);setAjuste({cantidad:'',motivo:'Reabastecimiento'});}}>
                        + Abastecer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {stockModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setStockModal(null)}>
          <div className="modal" style={{maxWidth:380}}>
            <div className="modal-header">
              <h3>Abastecer Stock</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setStockModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{fontSize:13,color:'var(--text2)',marginBottom:4}}><strong>{stockModal.nombre}</strong></p>
              <p style={{fontSize:13,color:'var(--text3)',marginBottom:12}}>Stock actual: <span className="mono">{fmtNum(stockModal.stock)}</span> / Mínimo: <span className="mono">{fmtNum(stockModal.stock_minimo)}</span></p>
              <div className="input-group">
                <label>Cantidad a ingresar</label>
                <input className="input" type="number" min="1" value={ajuste.cantidad}
                  onChange={e=>setAjuste(p=>({...p,cantidad:e.target.value}))} placeholder="Ej: 50"/>
              </div>
              <div className="input-group">
                <label>Motivo</label>
                <input className="input" value={ajuste.motivo}
                  onChange={e=>setAjuste(p=>({...p,motivo:e.target.value}))} placeholder="Ej: Compra a proveedor"/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setStockModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveAjuste}>Registrar entrada</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
