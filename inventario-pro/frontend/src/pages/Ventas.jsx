// ══════════════════════════════════════════════════════════════
//  Ventas.jsx  ·  V6 – + Envío de factura por email
// ══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmt, fmtNum, fmtDateTime } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function Ventas() {
  const { user } = useAuth();
  const [ventas, setVentas]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [detail, setDetail]     = useState(null);
  const [filters, setFilters]   = useState({ desde: '', hasta: '', estado: '' });

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

  // V4: Abrir factura PDF en nueva ventana (token en URL para autenticación)
  const abrirFactura = (id) => {
    const token = localStorage.getItem('token');
    window.open(`/api/ventas/${id}/factura?token=${token}`, '_blank');
  };

  // V6: Enviar factura por email
  const enviarFacturaEmail = async (venta) => {
    const emailSugerido = venta.cliente_email || detail?.cliente_email || '';
    const email = window.prompt('Email destinatario:', emailSugerido);
    if (!email) return; // usuario canceló o dejó vacío
    try {
      await api.post(`/ventas/${venta.id}/enviar-factura`, { email });
      toast.success(`Factura enviada a ${email}`);
    } catch (err) {
      console.error('Error enviando factura:', err.response?.data || err.message || err);
      toast.error(err.response?.data?.error || err.message || 'Error enviando factura');
    }
  };

  // V4: Compartir recibo por WhatsApp
  const compartirWhatsApp = async (venta) => {
    try {
      const { data } = await api.get(`/ventas/${venta.id}/recibo`);
      const cliente = data.cliente_nombre || 'Cliente General';
      const items = data.detalles.map(d =>
        `  • ${d.producto_nombre} x${d.cantidad} = ${fmt(d.subtotal)}`
      ).join('\n');

      const mensaje = [
        `🧾 *Recibo de compra - ${data.empresa || 'Inventario Pro'}*`,
        ``,
        `N° Venta: *${data.numero_venta}*`,
        `Cliente: ${cliente}`,
        `Fecha: ${new Date(data.creado_en).toLocaleString('es-CO')}`,
        ``,
        `*Productos:*`,
        items,
        ``,
        `Subtotal: ${fmt(data.subtotal)}`,
        data.descuento > 0 ? `Descuento: -${fmt(data.descuento)}` : null,
        `*TOTAL: ${fmt(data.total)}*`,
        ``,
        `¡Gracias por su compra! 🙏`,
      ].filter(l => l !== null).join('\n');

      // Si hay teléfono del cliente, pre-llenarlo
      const tel = data.cliente_tel?.replace(/\D/g, '') || '';
      const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
    } catch {
      toast.error('Error generando recibo para WhatsApp');
    }
  };

  const estadoBadge = e => ({
    completada: 'badge-green',
    pendiente:  'badge-yellow',
    cancelada:  'badge-red',
  }[e] || 'badge-gray');

  return (
    <Layout title="Ventas">
      <div className="table-wrapper" style={{ marginBottom: 20 }}>
        <div className="table-header">
          <span className="table-title">Registro de Ventas</span>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            <input className="input" type="date" value={filters.desde}
              onChange={e => setFilters(p => ({ ...p, desde: e.target.value }))} style={{ width: 140 }}/>
            <input className="input" type="date" value={filters.hasta}
              onChange={e => setFilters(p => ({ ...p, hasta: e.target.value }))} style={{ width: 140 }}/>
            <select className="input" value={filters.estado}
              onChange={e => setFilters(p => ({ ...p, estado: e.target.value }))} style={{ width: 130 }}>
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
                <th>N° Venta</th>
                <th>Cliente</th>
                {user?.rol === 'admin' && <th>Vendedor</th>}
                <th>Items</th>
                <th>Total</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ventas.length ? ventas.map(v => (
                <tr key={v.id}>
                  <td>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--accent)' }}>{v.numero_venta}</span>
                    {v.tiene_devolucion === 1 && (
                      <span className="badge badge-yellow" style={{ marginLeft: 6, fontSize: 9 }}>↩ dev.</span>
                    )}
                  </td>
                  <td>{v.cliente_nombre || <span style={{ color: 'var(--text3)' }}>General</span>}</td>
                  {user?.rol === 'admin' && <td style={{ color: 'var(--text2)', fontSize: 12 }}>{v.vendedor_nombre || '-'}</td>}
                  <td className="mono">{v.total_items}</td>
                  <td className="mono" style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(v.total)}</td>
                  <td><span className="badge badge-blue">{v.metodo_pago}</span></td>
                  <td><span className={`badge ${estadoBadge(v.estado)}`}>{v.estado}</span></td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>{fmtDateTime(v.creado_en)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetail(v.id)}>Ver</button>
                      {/* V4: Factura PDF */}
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Ver factura PDF"
                        onClick={() => abrirFactura(v.id)}
                      >
                        🧾
                      </button>
                      {/* V6: Email factura */}
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Enviar factura por email"
                        onClick={() => enviarFacturaEmail(v)}
                      >
                        📧
                      </button>
                      {/* V4: WhatsApp */}
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Enviar por WhatsApp"
                        onClick={() => compartirWhatsApp(v)}
                        style={{ color: '#25D366' }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={user?.rol === 'admin' ? 9 : 8}>
                    <div className="empty-state">No hay ventas registradas</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {detail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3>Venta <span className="mono" style={{ color: 'var(--accent)' }}>{detail.numero_venta}</span></h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDetail(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Cliente</span>
                  <p style={{ fontWeight: 600 }}>{detail.cliente_nombre || 'General'}</p></div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Fecha</span>
                  <p>{fmtDateTime(detail.creado_en)}</p></div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Método de pago</span>
                  <p>{detail.metodo_pago}</p></div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Vendedor</span>
                  <p>{detail.vendedor_nombre || '-'}</p></div>
                <div><span style={{ fontSize: 11, color: 'var(--text3)' }}>Estado</span>
                  <p><span className={`badge ${estadoBadge(detail.estado)}`}>{detail.estado}</span></p></div>
              </div>

              <table style={{ marginBottom: 16 }}>
                <thead><tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
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
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ background: 'var(--bg-page)', borderRadius: 8, padding: '14px 16px' }}>
                <div className="cart-total-row"><span>Subtotal</span><span className="mono">{fmt(detail.subtotal)}</span></div>
                {detail.impuesto > 0 && <div className="cart-total-row"><span>Impuesto</span><span className="mono">{fmt(detail.impuesto)}</span></div>}
                {detail.descuento > 0 && (
                  <div className="cart-total-row">
                    <span style={{ color: 'var(--green)' }}>Descuento</span>
                    <span className="mono text-green">−{fmt(detail.descuento)}</span>
                  </div>
                )}
                <div className="cart-total-row total"><span>TOTAL</span><span>{fmt(detail.total)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDetail(null)}>Cerrar</button>
              {/* V4: Botones de acción */}
              <button
                className="btn btn-secondary"
                onClick={() => compartirWhatsApp(detail)}
                style={{ color: '#25D366' }}
                title="Enviar recibo por WhatsApp"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
              {/* V6: Email factura en modal */}
              <button
                className="btn btn-secondary"
                onClick={() => enviarFacturaEmail(detail)}
                title="Enviar factura por email"
              >
                📧 Email
              </button>
              <button
                className="btn btn-primary"
                onClick={() => abrirFactura(detail.id)}
                title="Ver factura PDF"
              >
                🧾 Factura PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}