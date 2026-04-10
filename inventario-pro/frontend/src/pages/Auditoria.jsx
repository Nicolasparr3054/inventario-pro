// ══════════════════════════════════════════════════════════════
//  Auditoria.jsx  ·  V7 – Log de auditoría (solo admin)
// ══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { fmtDateTime } from '../utils/format';
import toast from 'react-hot-toast';

const ACCIONES = [
  { value: '',                  label: 'Todas las acciones' },
  { value: 'cambiar_precio',    label: 'Cambio de precio' },
  { value: 'crear_usuario',     label: 'Crear usuario' },
  { value: 'modificar_usuario', label: 'Modificar usuario' },
  { value: 'eliminar_usuario',  label: 'Eliminar usuario' },
  { value: 'cancelar_venta',    label: 'Cancelar venta' },
];

const accionBadge = a => ({
  cambiar_precio:    'badge-amber',
  crear_usuario:     'badge-green',
  modificar_usuario: 'badge-blue',
  eliminar_usuario:  'badge-red',
  cancelar_venta:    'badge-red',
}[a] || 'badge-gray');

const accionLabel = a => ({
  cambiar_precio:    'Cambio precio',
  crear_usuario:     'Crear usuario',
  modificar_usuario: 'Modificar usuario',
  eliminar_usuario:  'Eliminar usuario',
  cancelar_venta:    'Cancelar venta',
}[a] || a);

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [stats, setStats]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [filters, setFilters]     = useState({ accion: '', desde: '' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.accion) params.accion = filters.accion;
      if (filters.desde)  params.desde  = filters.desde;

      const { data: rows } = await api.get('/auditoria', { params });
      setRegistros(rows);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error cargando registros';
      setError(msg);
      toast.error('Error: ' + msg);
    }

    try {
      const { data: s } = await api.get('/auditoria/stats');
      setStats(s);
    } catch {
      // stats no es crítico, ignorar silenciosamente
      setStats([]);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <Layout>
        <div className="page-header">
          <h1 className="page-title">📋 Auditoría</h1>
        </div>
        <div style={{
          background: 'var(--red-bg)', border: '1px solid var(--red)',
          borderRadius: 10, padding: 24, textAlign: 'center', marginTop: 20
        }}>
          <p style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>
            ⚠️ No se pudo cargar la auditoría
          </p>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            {error}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            Asegúrate de haber ejecutado <code style={{ background:'var(--bg3)', padding:'2px 6px', borderRadius:4 }}>migration_v6.sql</code> en MySQL Workbench.
          </p>
          <button className="btn btn-primary" onClick={load}>Reintentar</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Auditoría</h1>
          <p className="page-sub">Registro de acciones críticas del sistema</p>
        </div>
      </div>

      {/* Stats */}
      {stats.length > 0 && (
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          {stats.slice(0, 4).map(s => (
            <div className="kpi-card" key={s.accion}>
              <div className="kpi-label">{accionLabel(s.accion)}</div>
              <div className="kpi-value">{s.total}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>últimos 30 días</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros + tabla */}
      <div className="table-wrapper">
        <div className="table-header">
          <span className="table-title">Registro de actividad</span>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            <select className="input" value={filters.accion}
              onChange={e => setFilters(p => ({ ...p, accion: e.target.value }))}
              style={{ width: 190 }}>
              {ACCIONES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <input className="input" type="date" value={filters.desde}
              onChange={e => setFilters(p => ({ ...p, desde: e.target.value }))}
              style={{ width: 150 }} />
            <button className="btn btn-secondary" onClick={load}>Filtrar</button>
            <button className="btn btn-ghost" onClick={() => {
              setFilters({ accion: '', desde: '' });
              setTimeout(load, 50);
            }}>Limpiar</button>
          </div>
        </div>

        {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Tabla</th>
                <th>ID</th>
                <th>Detalle</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {registros.length ? registros.map(r => (
                <tr key={r.id}>
                  <td style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {fmtDateTime(r.creado_en)}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{r.usuario_nombre || '—'}</td>
                  <td><span className={`badge ${accionBadge(r.accion)}`}>{accionLabel(r.accion)}</span></td>
                  <td><span className="mono" style={{ fontSize: 11, color: 'var(--text3)' }}>{r.tabla || '—'}</span></td>
                  <td className="mono" style={{ fontSize: 12, textAlign: 'center' }}>{r.registro_id || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 300 }}>
                    <span title={r.detalle} style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {r.detalle || '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{r.ip || '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      No hay registros aún. Los registros aparecerán cuando se cambien precios o se gestionen usuarios.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
