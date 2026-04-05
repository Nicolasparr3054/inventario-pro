// ══════════════════════════════════════════════════════════════
//  Devoluciones.jsx  ·  V4 – Gestión de devoluciones de ventas
// ══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtDateTime } from '../utils/format';
import toast from 'react-hot-toast';

export default function Devoluciones() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [detail, setDetail]             = useState(null);
  const [showForm, setShowForm]         = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/devoluciones');
      setDevoluciones(data);
    } catch { toast.error('Error cargando devoluciones'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/devoluciones/${id}`);
      setDetail(data);
    } catch { toast.error('Error cargando detalle'); }
  };

  return (
    <Layout title="Devoluciones">
      <div className="page-header">
        <h2>Devoluciones de ventas</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + Nueva devolución
        </button>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Registro de devoluciones</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>
            {devoluciones.length} registro(s)
          </span>
        </div>

        {loading ? <div className="spinner"/> : (
          <table>
            <thead>
              <tr>
                <th>N° Devolución</th>
                <th>N° Venta</th>
                <th>Cliente</th>
                <th>Total devuelto</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {devoluciones.length ? devoluciones.map(d => (
                <tr key={d.id}>
                  <td><span className="mono" style={{ color: 'var(--purple)' }}>{d.numero}</span></td>
                  <td><span className="mono" style={{ color: 'var(--accent)' }}>{d.numero_venta}</span></td>
                  <td>{d.cliente_nombre || <span style={{ color: 'var(--text3)' }}>General</span>}</td>
                  <td className="mono" style={{ color: 'var(--red)', fontWeight: 700 }}>
                    {fmt(d.total_devuelto)}
                  </td>
                  <td>
                    <span className={`badge ${
                      d.estado === 'aprobada' ? 'badge-green' :
                      d.estado === 'rechazada' ? 'badge-red' : 'badge-yellow'
                    }`}>{d.estado}</span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmtDateTime(d.creado_en)}</td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => openDetail(d.id)}>Ver</button></td>
                </tr>
              )) : (
                <tr><td colSpan={7}><div className="empty-state">Sin devoluciones registradas</div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {detail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <h3>Devolución <span className="mono" style={{ color: 'var(--purple)' }}>{detail.numero}</span></h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Venta original</span>
                  <p className="mono" style={{ color: 'var(--accent)' }}>{detail.numero_venta}</p></div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Cliente</span>
                  <p style={{ fontWeight: 600 }}>{detail.cliente_nombre || 'General'}</p></div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Estado</span>
                  <p><span className={`badge ${detail.estado === 'aprobada' ? 'badge-green' : 'badge-red'}`}>{detail.estado}</span></p></div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Fecha</span>
                  <p style={{ fontSize: 12 }}>{fmtDateTime(detail.creado_en)}</p></div>
              </div>
              {detail.motivo && (
                <div style={{ background: 'var(--amber-bg)', border: '0.5px solid var(--amber)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--text2)' }}>
                  <strong style={{ color: 'var(--amber)' }}>Motivo: </strong>{detail.motivo}
                </div>
              )}
              <table style={{ marginBottom: 16 }}>
                <thead>
                  <tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {detail.detalles?.map(d => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.producto_nombre}</strong><br/>
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{d.producto_codigo}</span>
                      </td>
                      <td className="mono">{d.cantidad}</td>
                      <td className="mono">{fmt(d.precio_unit)}</td>
                      <td className="mono" style={{ color: 'var(--red)', fontWeight: 600 }}>{fmt(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ background: 'var(--bg-page)', borderRadius: 8, padding: '14px 16px' }}>
                <div className="cart-total-row total">
                  <span>TOTAL DEVUELTO</span>
                  <span style={{ color: 'var(--red)' }}>{fmt(detail.total_devuelto)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva devolución */}
      {showForm && (
        <NuevaDevolucionForm
          onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load(); }}
        />
      )}
    </Layout>
  );
}

// ── Formulario nueva devolución ──────────────────────────────
function NuevaDevolucionForm({ onClose, onCreated }) {
  const [ventaId, setVentaId]     = useState('');
  const [ventaInfo, setVentaInfo] = useState(null);
  const [items, setItems]         = useState([]);
  const [motivo, setMotivo]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [buscando, setBuscando]   = useState(false);

  const buscarVenta = async () => {
    if (!ventaId.trim()) return;
    setBuscando(true);
    try {
      // Buscar por número de venta o por ID
      const id = ventaId.trim();
      const { data } = await api.get(
        id.startsWith('VTA-') ? `/ventas?numero=${id}` : `/ventas/${id}`
      );
      // Si data es array, tomar el primero
      const venta = Array.isArray(data) ? data[0] : data;
      if (!venta) { toast.error('Venta no encontrada'); return; }

      // Cargar detalle completo
      const { data: d } = await api.get(`/ventas/${venta.id}`);
      setVentaInfo(d);
      setItems(d.detalles.map(det => ({
        ...det,
        cantidadDevolver: 0,
        seleccionado: false,
      })));
    } catch { toast.error('Venta no encontrada'); }
    finally { setBuscando(false); }
  };

  const submit = async () => {
    const itemsSeleccionados = items.filter(i => i.seleccionado && i.cantidadDevolver > 0);
    if (!itemsSeleccionados.length) return toast.error('Selecciona al menos un producto');

    setLoading(true);
    try {
      await api.post('/devoluciones', {
        venta_id: ventaInfo.id,
        items: itemsSeleccionados.map(i => ({
          producto_id: i.producto_id,
          cantidad: i.cantidadDevolver,
        })),
        motivo: motivo || null,
      });
      toast.success('Devolución registrada exitosamente');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear devolución');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3>↩️ Nueva devolución</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Paso 1: buscar venta */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              ID o número de venta
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Ej: 42 o VTA-20240103-1234"
                value={ventaId}
                onChange={e => setVentaId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarVenta()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary" onClick={buscarVenta} disabled={buscando}>
                {buscando ? '…' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Paso 2: detalles de la venta */}
          {ventaInfo && (
            <>
              <div style={{ background: 'var(--accent-bg)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
                <strong style={{ color: 'var(--accent)' }}>{ventaInfo.numero_venta}</strong>
                {' · '}{ventaInfo.cliente_nombre || 'General'}
                {' · '}<span className="mono">{fmt(ventaInfo.total)}</span>
              </div>

              <p style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>
                Selecciona los productos a devolver:
              </p>

              {items.map((item, idx) => (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  border: `0.5px solid ${item.seleccionado ? 'var(--accent)' : 'var(--border)'}`,
                  background: item.seleccionado ? 'var(--accent-bg)' : 'var(--bg-page)',
                  marginBottom: 8, transition: 'all 0.15s',
                }}>
                  <input
                    type="checkbox"
                    checked={item.seleccionado}
                    onChange={e => setItems(p => p.map((i, j) =>
                      j === idx ? { ...i, seleccionado: e.target.checked, cantidadDevolver: e.target.checked ? 1 : 0 } : i
                    ))}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{item.producto_nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      Vendido: {item.cantidad} · {fmt(item.precio_unit)} c/u
                    </div>
                  </div>
                  {item.seleccionado && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>Cant:</span>
                      <input
                        type="number"
                        className="input"
                        min={1}
                        max={item.cantidad}
                        value={item.cantidadDevolver}
                        onChange={e => setItems(p => p.map((i, j) =>
                          j === idx ? { ...i, cantidadDevolver: Math.min(item.cantidad, Math.max(1, +e.target.value)) } : i
                        ))}
                        style={{ width: 60, textAlign: 'center', padding: '4px 8px', fontSize: 13 }}
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="input-group" style={{ marginTop: 14 }}>
                <label>Motivo de devolución (opcional)</label>
                <input
                  className="input"
                  placeholder="Ej: Producto defectuoso, talla incorrecta…"
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                />
              </div>

              {/* Resumen */}
              {items.filter(i => i.seleccionado).length > 0 && (
                <div style={{ background: 'var(--red-bg)', borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
                  <div className="cart-total-row">
                    <span>Productos a devolver</span>
                    <span>{items.filter(i => i.seleccionado).length}</span>
                  </div>
                  <div className="cart-total-row total" style={{ borderTopColor: 'var(--border)' }}>
                    <span>Total a restituir</span>
                    <span style={{ color: 'var(--red)' }}>
                      {fmt(items.filter(i => i.seleccionado).reduce((s, i) => s + i.cantidadDevolver * Number(i.precio_unit), 0))}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          {ventaInfo && (
            <button className="btn btn-danger" onClick={submit} disabled={loading}>
              {loading ? '…' : '↩️ Registrar devolución'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}