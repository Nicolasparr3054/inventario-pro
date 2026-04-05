// ══════════════════════════════════════════════════════════════
//  Empresa.jsx  ·  V4 – Configuración de datos de empresa
//                       (para facturas PDF)
// ══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Empresa() {
  const [config, setConfig] = useState({
    nombre: '', nit: '', direccion: '', telefono: '',
    email: '', ciudad: '', logo_url: '', moneda: 'COP', pie_factura: '',
  });
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);

  useEffect(() => {
    api.get('/empresa/config')
      .then(({ data }) => setConfig(c => ({ ...c, ...data })))
      .catch(() => toast.error('Error cargando configuración'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/empresa/config', config);
      toast.success('Configuración guardada');
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  const f = (k, label, placeholder = '', type = 'text') => (
    <div className="input-group">
      <label>{label}</label>
      <input
        className="input"
        type={type}
        placeholder={placeholder}
        value={config[k] || ''}
        onChange={e => setConfig(p => ({ ...p, [k]: e.target.value }))}
      />
    </div>
  );

  if (loading) return <Layout title="Mi empresa"><div className="spinner"/></Layout>;

  return (
    <Layout title="Mi empresa">
      <div className="page-header">
        <h2>Datos de la empresa</h2>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? '…' : '💾 Guardar'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Información general */}
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>
            🏢 Información general
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {f('nombre',    'Nombre de la empresa *', 'Mi Empresa S.A.S.')}
            {f('nit',       'NIT / RUC',              '900.123.456-7')}
            {f('ciudad',    'Ciudad',                  'Bogotá, Colombia')}
            {f('direccion', 'Dirección',               'Calle 123 # 45-67')}
            {f('telefono',  'Teléfono',                '+57 300 000 0000')}
            {f('email',     'Correo electrónico',      'info@empresa.com', 'email')}
          </div>
        </div>

        {/* Facturación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>
              🧾 Facturación
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label>Moneda</label>
                <select className="input" value={config.moneda} onChange={e => setConfig(p => ({ ...p, moneda: e.target.value }))}>
                  <option value="COP">COP - Peso colombiano</option>
                  <option value="USD">USD - Dólar americano</option>
                  <option value="MXN">MXN - Peso mexicano</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              {f('pie_factura', 'Pie de página en facturas', '¡Gracias por su compra!')}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
              🖼️ Logo
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {f('logo_url', 'URL del logo', 'https://mi-empresa.com/logo.png')}
              {config.logo_url && (
                <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg-page)', borderRadius: 8 }}>
                  <img
                    src={config.logo_url}
                    alt="Logo preview"
                    style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview rápido */}
          <div className="card" style={{ background: 'var(--accent-bg)', border: '0.5px solid var(--accent)' }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>
              📄 Vista previa de encabezado de factura
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.8 }}>
              <strong style={{ fontSize: 13, color: 'var(--text)' }}>{config.nombre || 'Mi Empresa'}</strong><br/>
              NIT: {config.nit || '—'}<br/>
              {config.direccion}<br/>
              {config.ciudad}<br/>
              {config.telefono} · {config.email}
            </div>
            {config.pie_factura && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)', fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
                {config.pie_factura}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}