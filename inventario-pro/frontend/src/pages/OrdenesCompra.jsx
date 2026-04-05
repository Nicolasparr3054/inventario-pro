// ══════════════════════════════════════════════════════════════
//  OrdenesCompra.jsx  ·  V4 – Órdenes de compra a proveedores
// ══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtDateTime } from '../utils/format';
import toast from 'react-hot-toast';

const ESTADOS = ['borrador', 'enviada', 'recibida', 'cancelada'];

const estadoBadge = e => ({
  borrador:  'badge-gray',
  enviada:   'badge-blue',
  recibida:  'badge-green',
  cancelada: 'badge-red',
}[e] || 'badge-gray');

const estadoEmoji = e => ({
  borrador: '📝', enviada: '📤', recibida: '✅', cancelada: '❌',
}[e] || '');

export default function OrdenesCompra() {
  const [ordenes, setOrdenes]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [detail, setDetail]         = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [editando, setEditando]     = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      const { data } = await api.get('/ordenes-compra', { params });
      setOrdenes(data);
    } catch { toast.error('Error cargando órdenes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filtroEstado]);

  const openDetail = async (id) => {
    try {
      const { data } = await api.get(`/ordenes-compra/${id}`);
      setDetail(data);
    } catch { toast.error('Error cargando detalle'); }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/ordenes-compra/${id}/estado`, { estado });
      toast.success(`Orden marcada como ${estado}`);
      if (estado === 'recibida') toast.success('Stock actualizado automáticamente');
      load();
      if (detail?.id === id) {
        const { data } = await api.get(`/ordenes-compra/${id}`);
        setDetail(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error cambiando estado');
    }
  };

  return (
    <Layout title="Órdenes de compra">
      <div className="page-header">
        <h2>Órdenes de compra</h2>
        <button className="btn btn-primary" onClick={() => { setEditando(null); setShowForm(true); }}>
          + Nueva orden
        </button>
      </div>

      {/* Filtros */}
      <div className="page-filters">
        <select className="input" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: 150 }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{estadoEmoji(e)} {e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Órdenes registradas</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{ordenes.length} orden(es)</span>
        </div>
        {loading ? <div className="spinner"/> : (
          <table>
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Proveedor</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th>F. Entrega</th>
                <th>Creada</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length ? ordenes.map(o => (
                <tr key={o.id}>
                  <td><span className="mono" style={{ color: 'var(--accent)' }}>{o.numero}</span></td>
                  <td style={{ fontWeight: 600 }}>{o.proveedor_nombre}</td>
                  <td className="mono">{o.total_items}</td>
                  <td className="mono" style={{ fontWeight: 700 }}>{fmt(o.total)}</td>
                  <td><span className={`badge ${estadoBadge(o.estado)}`}>{estadoEmoji(o.estado)} {o.estado}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {o.fecha_entrega ? new Date(o.fecha_entrega).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{fmtDateTime(o.creado_en)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetail(o.id)}>Ver</button>
                      {o.estado === 'borrador' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditando(o.id); setShowForm(true); }}>
                          Editar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8}><div className="empty-state">Sin órdenes de compra</div></td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {detail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3>Orden <span className="mono" style={{ color: 'var(--accent)' }}>{detail.numero}</span></h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Proveedor</span>
                  <p style={{ fontWeight: 600 }}>{detail.proveedor_nombre}</p>
                  {detail.proveedor_email && <p style={{ fontSize: 11, color: 'var(--text3)' }}>{detail.proveedor_email}</p>}
                </div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Estado</span>
                  <p><span className={`badge ${estadoBadge(detail.estado)}`}>{detail.estado}</span></p>
                </div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Fecha entrega</span>
                  <p>{detail.fecha_entrega ? new Date(detail.fecha_entrega).toLocaleDateString('es-CO') : '—'}</p>
                </div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Creada por</span>
                  <p>{detail.usuario_nombre || '—'}</p>
                </div>
              </div>

              {detail.notas && (
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'var(--text2)' }}>
                  📝 {detail.notas}
                </div>
              )}

              <table style={{ marginBottom: 16 }}>
                <thead><tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th><th>Recibido</th></tr></thead>
                <tbody>
                  {detail.detalles?.map(d => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.producto_nombre}</strong><br/>
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{d.producto_codigo}</span>
                      </td>
                      <td className="mono">{d.cantidad}</td>
                      <td className="mono">{fmt(d.precio_unit)}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>{fmt(d.subtotal)}</td>
                      <td>
                        {d.cantidad_recibida > 0
                          ? <span className="badge badge-green">{d.cantidad_recibida}</span>
                          : <span style={{ color: 'var(--text4)', fontSize: 12 }}>—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ background: 'var(--bg-page)', borderRadius: 8, padding: '14px 16px' }}>
                <div className="cart-total-row total">
                  <span>TOTAL</span><span>{fmt(detail.total)}</span>
                </div>
              </div>

              {/* Acciones de estado */}
              {detail.estado !== 'recibida' && detail.estado !== 'cancelada' && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {detail.estado === 'borrador' && (
                    <button className="btn btn-secondary" onClick={() => cambiarEstado(detail.id, 'enviada')}>
                      📤 Marcar como enviada
                    </button>
                  )}
                  {detail.estado === 'enviada' && (
                    <button className="btn btn-success" onClick={() => cambiarEstado(detail.id, 'recibida')}>
                      ✅ Marcar como recibida (ingresa stock)
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => cambiarEstado(detail.id, 'cancelada')}>
                    ❌ Cancelar orden
                  </button>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Form nueva / editar orden */}
      {showForm && (
        <OrdenForm
          ordenId={editando}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </Layout>
  );
}

// ── Formulario orden de compra ───────────────────────────────
function OrdenForm({ ordenId, onClose, onSaved }) {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos]     = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [items, setItems]             = useState([{ producto_id: '', cantidad: 1, precio_unit: 0 }]);
  const [notas, setNotas]             = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    Promise.all([api.get('/proveedores'), api.get('/productos')])
      .then(([pv, pr]) => { setProveedores(pv.data); setProductos(pr.data); });

    if (ordenId) {
      api.get(`/ordenes-compra/${ordenId}`).then(({ data }) => {
        setProveedorId(String(data.proveedor_id));
        setNotas(data.notas || '');
        setFechaEntrega(data.fecha_entrega?.slice(0, 10) || '');
        setItems(data.detalles.map(d => ({
          producto_id: String(d.producto_id),
          cantidad: d.cantidad,
          precio_unit: Number(d.precio_unit),
        })));
      });
    }
  }, [ordenId]);

  const addItem  = () => setItems(p => [...p, { producto_id: '', cantidad: 1, precio_unit: 0 }]);
  const remItem  = i => setItems(p => p.filter((_, j) => j !== i));
  const setItem  = (i, k, v) => setItems(p => p.map((it, j) => j === i ? { ...it, [k]: v } : it));

  const autoFillPrecio = (idx, prodId) => {
    const p = productos.find(x => String(x.id) === String(prodId));
    if (p) setItem(idx, 'precio_unit', Number(p.precio_compra) || 0);
  };

  const total = items.reduce((s, i) => s + (i.cantidad * i.precio_unit), 0);

  const submit = async () => {
    if (!proveedorId) return toast.error('Selecciona un proveedor');
    const validos = items.filter(i => i.producto_id && i.cantidad > 0 && i.precio_unit >= 0);
    if (!validos.length) return toast.error('Agrega al menos un producto válido');

    setLoading(true);
    try {
      const body = { proveedor_id: proveedorId, items: validos, notas, fecha_entrega: fechaEntrega || null };
      if (ordenId) {
        await api.put(`/ordenes-compra/${ordenId}`, body);
        toast.success('Orden actualizada');
      } else {
        await api.post('/ordenes-compra', body);
        toast.success('Orden creada');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando orden');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h3>{ordenId ? '✏️ Editar orden' : '🛒 Nueva orden de compra'}</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="input-group">
              <label>Proveedor *</label>
              <select className="input" value={proveedorId} onChange={e => setProveedorId(e.target.value)}>
                <option value="">Seleccionar…</option>
                {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Fecha de entrega esperada</label>
              <input className="input" type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)}/>
            </div>
            <div className="input-group full">
              <label>Notas</label>
              <input className="input" placeholder="Observaciones opcionales…" value={notas} onChange={e => setNotas(e.target.value)}/>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text2)' }}>Productos</span>
            <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Agregar</button>
          </div>

          {items.map((item, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 110px 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <select
                className="input"
                value={item.producto_id}
                onChange={e => { setItem(idx, 'producto_id', e.target.value); autoFillPrecio(idx, e.target.value); }}
                style={{ fontSize: 12 }}
              >
                <option value="">Seleccionar producto…</option>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <input
                className="input"
                type="number" min="1"
                value={item.cantidad}
                onChange={e => setItem(idx, 'cantidad', +e.target.value)}
                style={{ fontSize: 12, textAlign: 'center' }}
                placeholder="Cant."
              />
              <input
                className="input"
                type="number" min="0" step="0.01"
                value={item.precio_unit}
                onChange={e => setItem(idx, 'precio_unit', +e.target.value)}
                style={{ fontSize: 12, textAlign: 'right' }}
                placeholder="Precio unit."
              />
              <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => remItem(idx)}>✕</button>
            </div>
          ))}

          <div style={{ background: 'var(--bg-page)', borderRadius: 8, padding: '12px 14px', marginTop: 12 }}>
            <div className="cart-total-row total">
              <span>TOTAL ESTIMADO</span>
              <span className="mono">{fmt(total)}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? '…' : ordenId ? 'Guardar cambios' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  );
}