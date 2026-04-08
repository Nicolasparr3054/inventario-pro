// ══════════════════════════════════════════════════════════════
//  Etiquetas.jsx  ·  V5 – Generador de etiquetas en lote
// ══════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt } from '../utils/format';
import toast from 'react-hot-toast';

export default function Etiquetas() {
  const [productos, setProductos]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [seleccion, setSeleccion]   = useState({}); // { producto_id: cantidad }
  const [generando, setGenerando]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/etiquetas/productos', { params: { search } });
      setProductos(data);
    } catch { toast.error('Error cargando productos'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleProducto = (id) => {
    setSeleccion(prev => {
      if (prev[id]) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: 1 };
    });
  };

  const setCantidad = (id, val) => {
    const n = Math.max(1, Math.min(100, parseInt(val)||1));
    setSeleccion(prev => ({ ...prev, [id]: n }));
  };

  const totalEtiquetas = Object.values(seleccion).reduce((s, v) => s + v, 0);
  const seleccionados  = Object.keys(seleccion).length;

  const generar = async () => {
    if (!seleccionados) { toast.error('Selecciona al menos un producto'); return; }
    setGenerando(true);
    try {
      const items = Object.entries(seleccion).map(([producto_id, cantidad]) => ({
        producto_id: parseInt(producto_id), cantidad
      }));
      const token = localStorage.getItem('token');
      // Hacer POST y abrir en nueva pestaña
      const res = await api.post('/etiquetas/generar', { items });
      const blob = new Blob([res.data], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { toast.error('Error generando etiquetas'); }
    finally { setGenerando(false); }
  };

  const seleccionarTodos = () => {
    const nuevo = {};
    productos.forEach(p => { nuevo[p.id] = seleccion[p.id] || 1; });
    setSeleccion(nuevo);
  };
  const limpiarSeleccion = () => setSeleccion({});

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏷️ Etiquetas y Códigos de Barras</h1>
          <p className="page-sub">Selecciona productos y genera etiquetas para imprimir</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={generar}
          disabled={!seleccionados || generando}
        >
          {generando ? '⏳ Generando...' : `🖨️ Imprimir ${totalEtiquetas} etiqueta${totalEtiquetas !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Barra de herramientas */}
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, flexWrap:'wrap' }}>
        <input
          className="input"
          style={{ flex:1, minWidth:200, maxWidth:340 }}
          placeholder="🔍 Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-ghost btn-sm" onClick={seleccionarTodos}>Seleccionar todos</button>
        <button className="btn btn-ghost btn-sm" onClick={limpiarSeleccion}>Limpiar selección</button>
        {seleccionados > 0 && (
          <span style={{ fontSize:12, color:'var(--accent)', fontWeight:600 }}>
            {seleccionados} producto{seleccionados!==1?'s':''} seleccionado{seleccionados!==1?'s':''} · {totalEtiquetas} etiqueta{totalEtiquetas!==1?'s':''}
          </span>
        )}
      </div>

      {loading
        ? <div className="spinner" style={{ margin:'60px auto' }} />
        : (
          <div className="card" style={{ overflow:'auto' }}>
            <table className="table">
              <thead><tr>
                <th style={{width:40}}>✓</th>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th style={{textAlign:'right'}}>Precio</th>
                <th style={{textAlign:'right'}}>Stock</th>
                <th style={{width:120}}>Cantidad</th>
              </tr></thead>
              <tbody>
                {productos.map(p => {
                  const sel = p.id in seleccion;
                  return (
                    <tr key={p.id} style={{ background: sel ? 'var(--accent-bg)' : undefined, cursor:'pointer' }}
                      onClick={() => toggleProducto(p.id)}>
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={sel}
                          onChange={() => toggleProducto(p.id)}
                          style={{ cursor:'pointer', width:16, height:16 }} />
                      </td>
                      <td><code style={{ fontSize:11, fontFamily:'var(--mono)' }}>{p.codigo}</code></td>
                      <td style={{ fontWeight: sel ? 600 : 400 }}>{p.nombre}</td>
                      <td style={{ fontSize:12, color:'var(--text2)' }}>{p.categoria_nombre||'—'}</td>
                      <td style={{ textAlign:'right', fontWeight:600 }}>{fmt(p.precio_venta)}</td>
                      <td style={{ textAlign:'right', color: p.stock <= 0 ? 'var(--red)' : 'var(--text)' }}>{p.stock}</td>
                      <td onClick={e => e.stopPropagation()}>
                        {sel && (
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ padding:'0 6px' }}
                              onClick={() => setCantidad(p.id, seleccion[p.id] - 1)}>−</button>
                            <input
                              type="number" min="1" max="100"
                              value={seleccion[p.id]}
                              style={{ width:48, textAlign:'center', border:'1px solid var(--border)',
                                borderRadius:6, padding:'2px 6px', fontSize:13, background:'var(--bg-card)', color:'var(--text)' }}
                              onChange={e => setCantidad(p.id, e.target.value)}
                            />
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ padding:'0 6px' }}
                              onClick={() => setCantidad(p.id, seleccion[p.id] + 1)}>+</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {productos.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'var(--text3)' }}>
                    No se encontraron productos
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )
      }
    </Layout>
  );
}
