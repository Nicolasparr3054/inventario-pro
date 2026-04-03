import { useEffect, useState, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum, fmtDateTime } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function POS() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [search, setSearch]       = useState('');
  const [cart, setCart]           = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [metodo, setMetodo]       = useState('efectivo');
  const [descuento, setDescuento] = useState(0);
  const [loading, setLoading]     = useState(false);
  const [confirm, setConfirm]     = useState(false);
  const [recibo, setRecibo]       = useState(null);   // ← V3: recibo
  const [scanMode, setScanMode]   = useState(false);  // ← V3: escáner
  const [scanInput, setScanInput] = useState('');
  const scanRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/productos'), api.get('/clientes')])
      .then(([p, c]) => { setProductos(p.data); setClientes(c.data); })
      .catch(() => toast.error('Error cargando datos'));
  }, []);

  // Modo escáner: enfocar campo oculto automáticamente
  useEffect(() => {
    if (scanMode && scanRef.current) scanRef.current.focus();
  }, [scanMode]);

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

  // V3: buscar producto por código de barras
  const buscarCodigo = useCallback(async codigo => {
    if (!codigo.trim()) return;
    try {
      const { data } = await api.get('/productos/buscar-codigo', { params: { codigo: codigo.trim() } });
      addToCart(data);
      toast.success(`${data.nombre} agregado`);
    } catch {
      toast.error('Producto no encontrado: ' + codigo);
    }
    setScanInput('');
  }, [productos]);

  const handleScanKey = e => {
    if (e.key === 'Enter') {
      buscarCodigo(scanInput);
    }
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
      // V3: cargar recibo inmediatamente
      const { data: reciboData } = await api.get(`/ventas/${data.id}/recibo`);
      setRecibo(reciboData);
      setCart([]); setDescuento(0); setClienteId(''); setConfirm(false);
      const { data: prods } = await api.get('/productos');
      setProductos(prods);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error procesando venta');
    } finally { setLoading(false); }
  };

  // V3: imprimir recibo
  const imprimirRecibo = () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    const cliente = recibo.cliente_nombre || 'Cliente General';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Recibo ${recibo.numero_venta}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 300px; margin: 0 auto; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .total-row { font-size: 14px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          td { padding: 2px 0; font-size: 11px; }
          td:last-child { text-align: right; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">📦 Inventario Pro</div>
          <div>Recibo de Venta</div>
        </div>
        <div class="divider"></div>
        <div class="row"><span>N° Venta:</span><span class="bold">${recibo.numero_venta}</span></div>
        <div class="row"><span>Fecha:</span><span>${new Date(recibo.creado_en).toLocaleString('es-CO')}</span></div>
        <div class="row"><span>Cliente:</span><span>${cliente}</span></div>
        <div class="row"><span>Vendedor:</span><span>${recibo.vendedor_nombre || '-'}</span></div>
        <div class="row"><span>Método:</span><span>${recibo.metodo_pago}</span></div>
        <div class="divider"></div>
        <table>
          <tr><td class="bold">Producto</td><td class="bold">Cant</td><td class="bold">Precio</td><td class="bold">Total</td></tr>
          ${recibo.detalles.map(d=>`
            <tr>
              <td>${d.producto_nombre}</td>
              <td style="text-align:center">${d.cantidad}</td>
              <td style="text-align:right">$${Number(d.precio_unit).toLocaleString('es-CO')}</td>
              <td>$${Number(d.subtotal).toLocaleString('es-CO')}</td>
            </tr>
          `).join('')}
        </table>
        <div class="divider"></div>
        <div class="row"><span>Subtotal:</span><span>$${Number(recibo.subtotal).toLocaleString('es-CO')}</span></div>
        ${recibo.descuento>0?`<div class="row"><span>Descuento:</span><span>-$${Number(recibo.descuento).toLocaleString('es-CO')}</span></div>`:''}
        <div class="row total-row"><span>TOTAL:</span><span>$${Number(recibo.total).toLocaleString('es-CO')}</span></div>
        <div class="divider"></div>
        <div class="center" style="margin-top:8px;font-size:11px;color:#666">¡Gracias por su compra!</div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  };

  return (
    <Layout title="Punto de Venta">
      <div className="pos-grid">
        {/* Productos */}
        <div className="pos-products">
          <div style={{marginBottom:14,display:'flex',gap:8}}>
            <div className="search-box" style={{flex:1}}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input className="input" style={{width:'100%'}} placeholder="Buscar producto por nombre o código…"
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            {/* V3: botón escáner */}
            <button
              className={`btn ${scanMode?'btn-primary':'btn-secondary'}`}
              onClick={()=>setScanMode(s=>!s)}
              title={scanMode?'Desactivar escáner':'Activar escáner de código de barras'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M3 5a2 2 0 012-2h2M3 19a2 2 0 002 2h2M17 3h2a2 2 0 012 2M17 21h2a2 2 0 002-2"/>
                <line x1="7" y1="7" x2="7" y2="17"/><line x1="10" y1="7" x2="10" y2="17"/>
                <line x1="13" y1="7" x2="13" y2="12"/><line x1="16" y1="7" x2="16" y2="17"/>
              </svg>
              {scanMode ? 'Escáner ON' : 'Escáner'}
            </button>
          </div>

          {/* Campo oculto para capturar el escáner */}
          {scanMode && (
            <div style={{marginBottom:10,background:'var(--accent-bg)',border:'1px solid var(--accent)',borderRadius:8,padding:'10px 14px',display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:20}}>📷</span>
              <div style={{flex:1}}>
                <p style={{fontSize:12,fontWeight:600,color:'var(--accent)'}}>Modo escáner activo</p>
                <p style={{fontSize:11,color:'var(--text3)'}}>Escanea un código de barras o escríbelo y presiona Enter</p>
              </div>
              <input
                ref={scanRef}
                value={scanInput}
                onChange={e=>setScanInput(e.target.value)}
                onKeyDown={handleScanKey}
                className="input"
                style={{width:160,fontSize:12}}
                placeholder="Código..."
              />
            </div>
          )}

          <div className="product-cards-grid">
            {filtered.map(p => (
              <div key={p.id} className="product-card" onClick={()=>addToCart(p)}>
                {p.imagen_url
                  ? <img src={p.imagen_url} alt={p.nombre} style={{width:'100%',height:80,objectFit:'cover',borderRadius:6,marginBottom:8}}/>
                  : <div style={{fontSize:28,marginBottom:8}}>📦</div>
                }
                <div className="p-name" style={{fontWeight:600,fontSize:12,marginBottom:4,lineHeight:1.3}}>{p.nombre}</div>
                <div className="p-price" style={{fontSize:14,fontWeight:700,color:'var(--accent)'}}>{fmt(p.precio_venta)}</div>
                <div className="p-stock" style={{fontSize:11,color:'var(--text3)',marginTop:2}}>Stock: {fmtNum(p.stock)}</div>
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
                  <div className="ci-name" style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{i.nombre}</div>
                    <div style={{fontSize:11,color:'var(--accent)',fontFamily:'var(--mono)'}}>{fmt(i.precio_unit)}</div>
                  </div>
                  <div className="ci-qty" style={{display:'flex',alignItems:'center',gap:4}}>
                    <button className="qty-btn" onClick={()=>updateQty(i.producto_id,-1)}>−</button>
                    <span style={{minWidth:24,textAlign:'center',fontWeight:700,fontSize:13}}>{i.cantidad}</span>
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

      {/* Modal confirmar */}
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

      {/* V3: Modal recibo */}
      {recibo && (
        <div className="modal-overlay">
          <div className="modal" style={{maxWidth:420}}>
            <div className="modal-header">
              <h3>✅ Venta registrada</h3>
            </div>
            <div className="modal-body">
              <div style={{background:'var(--bg-page)',borderRadius:8,padding:16,marginBottom:16,fontFamily:'var(--mono)',fontSize:12}}>
                <div style={{textAlign:'center',marginBottom:12}}>
                  <p style={{fontWeight:700,fontSize:14}}>📦 Inventario Pro</p>
                  <p style={{color:'var(--text3)'}}>Recibo de Venta</p>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{color:'var(--text3)'}}>N° Venta</span>
                  <span style={{fontWeight:700,color:'var(--accent)'}}>{recibo.numero_venta}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{color:'var(--text3)'}}>Cliente</span>
                  <span>{recibo.cliente_nombre||'General'}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                  <span style={{color:'var(--text3)'}}>Método</span>
                  <span>{recibo.metodo_pago}</span>
                </div>
                <div style={{borderTop:'1px dashed var(--border)',paddingTop:10,marginBottom:10}}>
                  {recibo.detalles.map(d=>(
                    <div key={d.id} style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{flex:1}}>{d.producto_nombre} x{d.cantidad}</span>
                      <span>{fmt(d.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div style={{borderTop:'1px dashed var(--border)',paddingTop:10}}>
                  {recibo.descuento>0 && (
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,color:'var(--green)'}}>
                      <span>Descuento</span><span>-{fmt(recibo.descuento)}</span>
                    </div>
                  )}
                  <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,fontSize:14}}>
                    <span>TOTAL</span><span>{fmt(recibo.total)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setRecibo(null)}>Cerrar</button>
              <button className="btn btn-secondary" onClick={imprimirRecibo}>
                🖨️ Imprimir recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}