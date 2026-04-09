// ══════════════════════════════════════════════════════════════
//  POS.jsx  ·  V6 – + Envío de factura por email post-venta
// ══════════════════════════════════════════════════════════════
import { useEffect, useState, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function POS() {
  const { user } = useAuth();
  const [productos, setProductos]   = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [search, setSearch]         = useState('');
  const [cart, setCart]             = useState([]);
  const [clienteId, setClienteId]   = useState('');
  const [metodo, setMetodo]         = useState('efectivo');
  const [descuentoMonto, setDescuentoMonto] = useState(0);
  const [descuentoObj, setDescuentoObj]     = useState(null);
  const [codigoDesc, setCodigoDesc] = useState('');
  const [loading, setLoading]       = useState(false);
  const [confirm, setConfirm]       = useState(false);
  const [recibo, setRecibo]         = useState(null);
  const [scanMode, setScanMode]     = useState(false);
  const [scanInput, setScanInput]   = useState('');
  const [camMode, setCamMode]       = useState(false);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [turnoChecked, setTurnoChecked] = useState(false);
  const scanRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/productos'), api.get('/clientes')])
      .then(([p, c]) => { setProductos(p.data); setClientes(c.data); })
      .catch(() => toast.error('Error cargando datos'));
  }, []);

  useEffect(() => {
    if (user?.rol === 'cajero' || user?.rol === 'admin') {
      api.get('/caja/turno-activo')
        .then(r => { setTurnoActivo(r.data); setTurnoChecked(true); })
        .catch(() => setTurnoChecked(true));
    } else { setTurnoChecked(true); }
  }, [user]);

  useEffect(() => {
    if (scanMode && scanRef.current) scanRef.current.focus();
  }, [scanMode]);

  useEffect(() => {
    if (!camMode) {
      if (scannerRef.current) { try { scannerRef.current.stop(); } catch {} scannerRef.current = null; }
      return;
    }
    const startScanner = async () => {
      if (!window.Html5Qrcode) { toast.error('Librería de escáner no cargada'); setCamMode(false); return; }
      try {
        const scanner = new window.Html5Qrcode('cam-scanner-box');
        scannerRef.current = scanner;
        await scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 150 } },
          async (decodedText) => { await buscarCodigo(decodedText); }, () => {});
      } catch { toast.error('No se pudo acceder a la cámara'); setCamMode(false); }
    };
    startScanner();
    return () => { if (scannerRef.current) { try { scannerRef.current.stop(); } catch {} scannerRef.current = null; } };
  }, [camMode]);

  const filtered = productos.filter(p =>
    p.stock > 0 && (p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = useCallback(p => {
    setCart(prev => {
      const ex = prev.find(i => i.producto_id === p.id);
      if (ex) {
        if (ex.cantidad >= p.stock) { toast.error('Stock insuficiente'); return prev; }
        return prev.map(i => i.producto_id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...prev, { producto_id: p.id, nombre: p.nombre, precio_unit: p.precio_venta, cantidad: 1, stock: p.stock }];
    });
  }, []);

  const buscarCodigo = useCallback(async codigo => {
    if (!codigo.trim()) return;
    try {
      const { data } = await api.get('/productos/buscar-codigo', { params: { codigo: codigo.trim() } });
      addToCart(data); toast.success('✓ ' + data.nombre);
    } catch { toast.error('Producto no encontrado: ' + codigo); }
    setScanInput('');
  }, [addToCart]);

  const handleScanKey = e => { if (e.key === 'Enter') buscarCodigo(scanInput); };

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

  const aplicarDescuento = async () => {
    if (!codigoDesc.trim()) return;
    try {
      const { data } = await api.get('/descuentos/buscar', { params: { codigo: codigoDesc.trim() } });
      const monto = data.tipo === 'porcentaje' ? (subtotal * parseFloat(data.valor)) / 100 : parseFloat(data.valor);
      setDescuentoObj(data); setDescuentoMonto(monto);
      toast.success('Descuento "' + data.nombre + '" aplicado');
    } catch (err) { toast.error(err.response?.data?.error || 'Código inválido'); setDescuentoObj(null); setDescuentoMonto(0); }
  };

  const quitarDescuento = () => { setDescuentoObj(null); setDescuentoMonto(0); setCodigoDesc(''); };

  const subtotal = cart.reduce((s, i) => s + i.precio_unit * i.cantidad, 0);
  const total    = Math.max(0, subtotal - Number(descuentoMonto));

  const checkout = async () => {
    if (!cart.length) return toast.error('Carrito vacío');
    if (user?.rol === 'cajero' && !turnoActivo) return toast.error('Debes abrir un turno de caja antes de vender');
    setLoading(true);
    try {
      const payload = {
        cliente_id: clienteId || null,
        items: cart.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad, precio_unit: i.precio_unit })),
        metodo_pago: metodo, descuento: Number(descuentoMonto),
        descuento_id: descuentoObj?.id || null, descuento_codigo: descuentoObj?.codigo || null,
        turno_id: turnoActivo?.id || null,
      };
      const { data } = await api.post('/ventas', payload);
      const { data: reciboData } = await api.get('/ventas/' + data.id + '/recibo');
      setRecibo(reciboData);
      setCart([]); setDescuentoMonto(0); setDescuentoObj(null); setCodigoDesc(''); setClienteId(''); setConfirm(false);
      const { data: prods } = await api.get('/productos');
      setProductos(prods);
    } catch (err) { toast.error(err.response?.data?.error || 'Error procesando venta'); }
    finally { setLoading(false); }
  };

  const imprimirRecibo = () => {
    const win = window.open('', '_blank', 'width=400,height=600');
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Recibo ' + recibo.numero_venta + '</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:"Courier New",monospace;font-size:12px;padding:16px;max-width:300px;margin:0 auto;}.center{text-align:center;}.bold{font-weight:bold;}.divider{border-top:1px dashed #000;margin:8px 0;}.row{display:flex;justify-content:space-between;margin:3px 0;}.title{font-size:16px;font-weight:bold;margin-bottom:4px;}.total-row{font-size:14px;font-weight:bold;}@media print{button{display:none;}}</style></head><body><div class="center"><div class="title">📦 ' + (recibo.empresa||'Inventario Pro') + '</div><div>Recibo de Venta</div></div><div class="divider"></div><div class="row"><span>N° Venta:</span><span class="bold">' + recibo.numero_venta + '</span></div><div class="row"><span>Fecha:</span><span>' + new Date(recibo.creado_en).toLocaleString('es-CO') + '</span></div><div class="row"><span>Cliente:</span><span>' + (recibo.cliente_nombre||'General') + '</span></div><div class="row"><span>Método:</span><span>' + recibo.metodo_pago + '</span></div><div class="divider"></div>' + recibo.detalles.map(d => '<div class="row"><span>' + d.producto_nombre + ' x' + d.cantidad + '</span><span>$' + Number(d.subtotal).toLocaleString('es-CO') + '</span></div>').join('') + '<div class="divider"></div>' + (recibo.descuento > 0 ? '<div class="row"><span>Descuento:</span><span>-$' + Number(recibo.descuento).toLocaleString('es-CO') + '</span></div>' : '') + '<div class="row total-row"><span>TOTAL:</span><span>$' + Number(recibo.total).toLocaleString('es-CO') + '</span></div><div class="divider"></div><div class="center" style="margin-top:8px;font-size:11px">¡Gracias por su compra!</div><script>window.onload=()=>window.print();<\/script></body></html>';
    win.document.write(html); win.document.close();
  };

  const abrirFactura = () => {
    const token = localStorage.getItem('token');
    window.open('/api/ventas/' + recibo.id + '/factura?token=' + token, '_blank');
  };

  // V6: Enviar factura por email desde el POS
  const enviarFacturaEmail = async () => {
    const clienteData = clientes.find(c => String(c.id) === String(recibo.cliente_id));
    const emailSugerido = recibo.cliente_email || clienteData?.email || '';
    const email = window.prompt('Email destinatario:', emailSugerido);
    if (!email) return;
    try {
      await api.post('/ventas/' + recibo.id + '/enviar-factura', { email });
      toast.success('Factura enviada a ' + email);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error enviando factura');
    }
  };

  const compartirWhatsApp = () => {
    const items = recibo.detalles.map(d => '  • ' + d.producto_nombre + ' x' + d.cantidad + ' = $' + Number(d.subtotal).toLocaleString('es-CO')).join('\n');
    const msg = '🧾 *Recibo - ' + (recibo.empresa||'Inventario Pro') + '*\n\nN°: *' + recibo.numero_venta + '*\nCliente: ' + (recibo.cliente_nombre||'General') + '\nFecha: ' + new Date(recibo.creado_en).toLocaleString('es-CO') + '\n\n*Productos:*\n' + items + '\n\n*TOTAL: $' + Number(recibo.total).toLocaleString('es-CO') + '*\n\n¡Gracias por su compra! 🙏';
    const clienteData = clientes.find(c => String(c.id) === String(clienteId));
    const tel = clienteData?.telefono?.replace(/\D/g, '') || '';
    window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank');
  };

  const sinTurno = turnoChecked && user?.rol === 'cajero' && !turnoActivo;

  return (
    <Layout>
      <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js" async />

      {sinTurno && (
        <div style={{ background:'var(--amber-bg)', border:'1px solid var(--amber)', borderRadius:8,
          padding:'12px 16px', marginBottom:16, display:'flex', gap:10, alignItems:'center' }}>
          <span>⚠️</span>
          <span style={{ fontSize:13 }}>No tienes un turno de caja abierto. <strong>Ve a Caja para abrir tu turno</strong> antes de vender.</span>
        </div>
      )}

      <div className="pos-grid">
        <div className="pos-products">
          <div style={{ marginBottom:14, display:'flex', gap:8, flexWrap:'wrap' }}>
            <div className="search-box" style={{ flex:1, minWidth:160 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input className="search-input" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className={'btn btn-sm ' + (scanMode ? 'btn-primary' : 'btn-ghost')} onClick={() => { setScanMode(s => !s); setCamMode(false); }}>📟 Escáner</button>
            <button className={'btn btn-sm ' + (camMode ? 'btn-primary' : 'btn-ghost')} onClick={() => { setCamMode(s => !s); setScanMode(false); }}>📷 Cámara</button>
          </div>

          {scanMode && (
            <div style={{ display:'flex', gap:10, alignItems:'center', background:'var(--accent-bg)', border:'1px solid var(--accent)', borderRadius:8, padding:'10px 14px', marginBottom:12 }}>
              <span style={{ fontSize:20 }}>📷</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:12, fontWeight:600, color:'var(--accent)' }}>Modo escáner activo</p>
                <p style={{ fontSize:11, color:'var(--text3)' }}>Escanea o escribe el código y presiona Enter</p>
              </div>
              <input ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={handleScanKey} className="input" style={{ width:160, fontSize:12 }} placeholder="Código..." />
            </div>
          )}

          {camMode && (
            <div style={{ marginBottom:12 }}>
              <div id="cam-scanner-box" style={{ borderRadius:10, overflow:'hidden', background:'#000', minHeight:200 }} />
              <p style={{ fontSize:11, color:'var(--text3)', textAlign:'center', marginTop:6 }}>Apunta la cámara al código de barras del producto</p>
            </div>
          )}

          <div className="product-cards-grid">
            {filtered.map(p => (
              <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                {p.imagen_url ? <img src={p.imagen_url} alt={p.nombre} style={{ width:'100%', height:80, objectFit:'cover', borderRadius:6, marginBottom:8 }}/> : <div style={{ fontSize:28, marginBottom:8 }}>📦</div>}
                <div style={{ fontWeight:600, fontSize:12, marginBottom:4, lineHeight:1.3 }}>{p.nombre}</div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--accent)' }}>{fmt(p.precio_venta)}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Stock: {fmtNum(p.stock)}</div>
                {p.categoria_nombre && <div style={{ marginTop:6 }}><span className="badge" style={{ background:(p.categoria_color||'#6366f1')+'22', color:p.categoria_color||'#6366f1', fontSize:10 }}>{p.categoria_nombre}</span></div>}
              </div>
            ))}
            {!filtered.length && <p style={{ color:'var(--text3)', gridColumn:'1/-1', padding:40, textAlign:'center' }}>Sin productos disponibles</p>}
          </div>
        </div>

        <div className="cart-panel">
          <div className="cart-header">🛒 Carrito ({cart.length})</div>
          <div className="cart-items">
            {cart.length === 0
              ? <p style={{ color:'var(--text3)', fontSize:13, textAlign:'center', marginTop:40 }}>Selecciona productos del catálogo</p>
              : cart.map(i => (
                <div key={i.producto_id} className="cart-item">
                  <div className="ci-name" style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--accent)', fontFamily:'var(--mono)' }}>{fmt(i.precio_unit)}</div>
                  </div>
                  <div className="ci-qty" style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <button className="qty-btn" onClick={() => updateQty(i.producto_id, -1)}>−</button>
                    <span style={{ minWidth:24, textAlign:'center', fontWeight:700, fontSize:13 }}>{i.cantidad}</span>
                    <button className="qty-btn" onClick={() => updateQty(i.producto_id, 1)}>+</button>
                    <button className="qty-btn" style={{ fontSize:12, color:'var(--red)' }} onClick={() => removeItem(i.producto_id)}>✕</button>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="cart-footer">
            <div style={{ marginBottom:12, display:'flex', flexDirection:'column', gap:8 }}>
              <select className="input" value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ fontSize:12 }}>
                <option value="">Cliente general</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select className="input" value={metodo} onChange={e => setMetodo(e.target.value)} style={{ fontSize:12 }}>
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="otro">Otro</option>
              </select>
              {!descuentoObj ? (
                <div style={{ display:'flex', gap:6 }}>
                  <input className="input" style={{ flex:1, fontSize:12, textTransform:'uppercase', fontFamily:'var(--mono)' }}
                    placeholder="Código descuento..." value={codigoDesc}
                    onChange={e => setCodigoDesc(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && aplicarDescuento()} />
                  <button className="btn btn-ghost btn-sm" onClick={aplicarDescuento}>Aplicar</button>
                </div>
              ) : (
                <div style={{ background:'var(--green-bg)', border:'1px solid var(--green)', borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--green)' }}>🏷️ {descuentoObj.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>Código: {descuentoObj.codigo}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={quitarDescuento} style={{ color:'var(--red)' }}>✕</button>
                </div>
              )}
              {!descuentoObj && (
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <label style={{ fontSize:12, color:'var(--text2)', whiteSpace:'nowrap' }}>Desc. manual $</label>
                  <input className="input" type="number" min="0" value={descuentoMonto} onChange={e => setDescuentoMonto(e.target.value)} style={{ fontSize:12 }}/>
                </div>
              )}
            </div>
            <div className="cart-total-row"><span>Subtotal</span><span className="mono">{fmt(subtotal)}</span></div>
            {Number(descuentoMonto) > 0 && (
              <div className="cart-total-row">
                <span style={{ color:'var(--green)' }}>{descuentoObj ? 'Descuento (' + (descuentoObj.tipo === 'porcentaje' ? descuentoObj.valor + '%' : fmt(descuentoObj.valor)) + ')' : 'Descuento'}</span>
                <span className="mono" style={{ color:'var(--green)' }}>−{fmt(descuentoMonto)}</span>
              </div>
            )}
            <div className="cart-total-row total"><span>TOTAL</span><span>{fmt(total)}</span></div>
            {turnoActivo && <div style={{ fontSize:11, color:'var(--green)', textAlign:'center', marginTop:6 }}>🟢 Turno #{turnoActivo.id} activo</div>}
            <button className="btn btn-primary" disabled={!cart.length || loading || sinTurno}
              style={{ width:'100%', justifyContent:'center', marginTop:12, padding:'12px' }} onClick={() => setConfirm(true)}>
              {loading ? 'Procesando…' : sinTurno ? '⚠️ Abre un turno primero' : '✅ Confirmar venta'}
            </button>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:360 }}>
            <div className="modal-header"><h3>Confirmar venta</h3></div>
            <div className="modal-body">
              <p style={{ color:'var(--text2)' }}>¿Registrar esta venta por <strong style={{ color:'var(--accent)', fontFamily:'var(--mono)' }}>{fmt(total)}</strong>?</p>
              <p style={{ fontSize:12, color:'var(--text3)', marginTop:8 }}>{cart.length} producto(s) · Pago: {metodo}{descuentoObj ? ' · Descuento: ' + descuentoObj.codigo : ''}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={checkout} disabled={loading}>{loading ? '…' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal recibo — V6: botón 📧 Email añadido */}
      {recibo && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth:440 }}>
            <div className="modal-header"><h3>✅ Venta registrada</h3></div>
            <div className="modal-body">
              <div style={{ background:'var(--bg-page)', borderRadius:8, padding:16, marginBottom:16, fontFamily:'var(--mono)', fontSize:12 }}>
                <div style={{ textAlign:'center', marginBottom:12 }}>
                  <p style={{ fontWeight:700, fontSize:14 }}>📦 {recibo.empresa || 'Inventario Pro'}</p>
                  <p style={{ color:'var(--text3)' }}>Recibo de Venta</p>
                </div>
                {[['N° Venta', recibo.numero_venta], ['Cliente', recibo.cliente_nombre||'General'], ['Método', recibo.metodo_pago]].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ color:'var(--text3)' }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop:'1px dashed var(--border)', paddingTop:10, margin:'10px 0' }}>
                  {recibo.detalles.map(d => (
                    <div key={d.id} style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span>{d.producto_nombre} x{d.cantidad}</span><span>{fmt(d.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop:'1px dashed var(--border)', paddingTop:10 }}>
                  {recibo.descuento > 0 && (
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, color:'var(--green)' }}>
                      <span>Descuento</span><span>-{fmt(recibo.descuento)}</span>
                    </div>
                  )}
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:14 }}>
                    <span>TOTAL</span><span>{fmt(recibo.total)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ flexWrap:'wrap', gap:6 }}>
              <button className="btn btn-ghost" onClick={() => setRecibo(null)}>Cerrar</button>
              <button className="btn btn-secondary" onClick={imprimirRecibo}>🖨️ Recibo</button>
              <button className="btn btn-secondary" onClick={abrirFactura}>🧾 Factura PDF</button>
              {/* V6: Email */}
              <button className="btn btn-secondary" onClick={enviarFacturaEmail}>📧 Email</button>
              <button className="btn btn-secondary" onClick={compartirWhatsApp} style={{ color:'#25D366', borderColor:'#25D366', background:'rgba(37,211,102,0.06)' }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
