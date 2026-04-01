import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum } from '../utils/format';
import toast from 'react-hot-toast';

export default function POS() {
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [search, setSearch]       = useState('');
  const [cart, setCart]           = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [metodo, setMetodo]       = useState('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [confirm, setConfirm]     = useState(false);

  useEffect(() => {
    Promise.all([api.get('/productos'), api.get('/clientes')])
      .then(([p, c]) => { setProductos(p.data); setClientes(c.data); })
      .catch(() => toast.error('Error cargando datos'));
  }, []);

  const filtered = productos.filter(p =>
    p.stock > 0 && (
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase())
    )
  );

  const addToCart = p => {
    setCart(prev => {
      const ex = prev.find(i => i.producto_id === p.id);
      if (ex) {
        if (ex.cantidad >= p.stock) { toast.error('Stock insuficiente'); return prev; }
        return prev.map(i => i.producto_id===p.id ? {...i, cantidad: i.cantidad+1} : i);
      }
      return [...prev, { producto_id: p.id, nombre: p.nombre, precio_unit: p.precio_venta, cantidad: 1, stock: p.stock }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.producto_id !== id) return i;
      const nq = i.cantidad + delta;
      if (nq <= 0) return null;
      if (nq > i.stock) { toast.error('Stock insuficiente'); return i; }
      return { ...i, cantidad: nq };
    }).filter(Boolean));
  };

  const removeItem = id => setCart(p => p.filter(i => i.producto_id !== id));

  const subtotal = cart.reduce((s, i) => s + i.precio_unit * i.cantidad, 0);
  const total    = subtotal - Number(descuento);

  const checkout = async () => {
    if (!cart.length) return toast.error('Carrito vacío');
    setLoading(true);
    try {
      const { data } = await api.post('/ventas', {
        cliente_id: clienteId || null,
        items: cart.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad, precio_unit: i.precio_unit })),
        metodo_pago: metodo,
        descuento: Number(descuento),
      });
      toast.success(`✅ Venta ${data.numero_venta} registrada — ${fmt(data.total)}`);
      setCart([]); setDescuento(0); setClienteId(''); setConfirm(false);
      // Recargar stock
      const { data: prods } = await api.get('/productos');
      setProductos(prods);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error procesando venta');
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Punto de Venta">
      <div className="pos-grid">
        {/* Productos */}
        <div className="pos-products">
          <div style={{marginBottom:14}}>
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input className="input" style={{width:'100%'}} placeholder="Buscar producto por nombre o código…"
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
          <div className="product-cards-grid">
            {filtered.map(p => (
              <div key={p.id} className="product-card" onClick={()=>addToCart(p)}>
                <div style={{fontSize:28,marginBottom:8}}>📦</div>
                <div className="p-name">{p.nombre}</div>
                <div className="p-price">{fmt(p.precio_venta)}</div>
                <div className="p-stock">Stock: {fmtNum(p.stock)}</div>
                {p.categoria_nombre && <div style={{marginTop:6}}><span className="badge" style={{background:p.categoria_color+'22',color:p.categoria_color,fontSize:10}}>{p.categoria_nombre}</span></div>}
              </div>
            ))}
            {!filtered.length && <p style={{color:'var(--text3)',gridColumn:'1/-1',padding:40,textAlign:'center'}}>Sin productos disponibles</p>}
          </div>
        </div>

        {/* Carrito */}
        <div className="cart-panel">
          <div className="cart-header">🛒 Carrito ({cart.length} productos)</div>
          <div className="cart-items">
            {cart.length === 0
              ? <p style={{color:'var(--text3)',fontSize:13,textAlign:'center',marginTop:40}}>Selecciona productos del catálogo</p>
              : cart.map(i => (
                <div key={i.producto_id} className="cart-item">
                  <div className="ci-name">
                    <div style={{fontWeight:600}}>{i.nombre}</div>
                    <div style={{fontSize:11,color:'var(--accent)',fontFamily:'var(--mono)'}}>{fmt(i.precio_unit)}</div>
                  </div>
                  <div className="ci-qty">
                    <button className="qty-btn" onClick={()=>updateQty(i.producto_id,-1)}>−</button>
                    <span style={{minWidth:24,textAlign:'center',fontWeight:700}}>{i.cantidad}</span>
                    <button className="qty-btn" onClick={()=>updateQty(i.producto_id,1)}>+</button>
                    <button className="qty-btn" style={{fontSize:12,color:'var(--red)'}} onClick={()=>removeItem(i.producto_id)}>✕</button>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="cart-footer">
            <div style={{marginBottom:12,display:'flex',flexDirection:'column',gap:8}}>
              <select className="input" value={clienteId} onChange={e=>setClienteId(e.target.value)} style={{fontSize:12}}>
                <option value="">Cliente general</option>
                {clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select className="input" value={metodo} onChange={e=>setMetodo(e.target.value)} style={{fontSize:12}}>
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="otro">Otro</option>
              </select>
              <div className="flex gap-8" style={{alignItems:'center'}}>
                <label style={{fontSize:12,color:'var(--text2)',whiteSpace:'nowrap'}}>Descuento $</label>
                <input className="input" type="number" min="0" value={descuento}
                  onChange={e=>setDescuento(e.target.value)} style={{fontSize:12}}/>
              </div>
            </div>
            <div className="cart-total-row"><span>Subtotal</span><span className="mono">{fmt(subtotal)}</span></div>
            {descuento>0 && <div className="cart-total-row"><span style={{color:'var(--green)'}}>Descuento</span><span className="mono text-green">−{fmt(descuento)}</span></div>}
            <div className="cart-total-row total"><span>TOTAL</span><span>{fmt(total)}</span></div>
            <button className="btn btn-primary" disabled={!cart.length||loading}
              style={{width:'100%',justifyContent:'center',marginTop:12,padding:'12px'}}
              onClick={()=>setConfirm(true)}>
              {loading ? 'Procesando…' : '✅ Confirmar venta'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:360}}>
            <div className="modal-header"><h3>Confirmar venta</h3></div>
            <div className="modal-body">
              <p style={{color:'var(--text2)'}}>¿Deseas registrar esta venta por <strong style={{color:'var(--accent)',fontFamily:'var(--mono)'}}>{fmt(total)}</strong>?</p>
              <p style={{fontSize:12,color:'var(--text3)',marginTop:8}}>{cart.length} producto(s) · Pago: {metodo}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={checkout} disabled={loading}>
                {loading?'…':'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}