// ══════════════════════════════════════════════════════════════
//  Layout.jsx  ·  V7 – + Auditoría en menú + dark mode mejorado
// ══════════════════════════════════════════════════════════════
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Icon = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d={d}/>
  </svg>
);

const icons = {
  dash:     'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6',
  pos:      'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M10 19a1 1 0 100 2 1 1 0 000-2zm7 0a1 1 0 100 2 1 1 0 000-2z',
  prods:    'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  ventas:   'M9 14l6-6m-5.5.5a.5.5 0 11-1 0 .5.5 0 011 0zm6 6a.5.5 0 11-1 0 .5.5 0 011 0zm-6-1a4 4 0 104 0 4 4 0 00-4 0',
  devoluc:  'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
  ordenes:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  inv:      'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
  clientes: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm8 4a3 3 0 015.5 0',
  config:   'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0',
  usuarios: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  logout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  bell:     'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  moon:     'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  sun:      'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  sucursal: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  descuento:'M7 7h.01M17 17h.01M9.172 14.828L14.828 9.17M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  caja:     'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  etiqueta: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  auditoria:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  reporte:  'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  empresa:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
};

// ── Notif panel ──────────────────────────────────────────────
function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/notificaciones');
      setNotifs(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const marcarLeida = async (id) => {
    await api.patch(`/notificaciones/${id}/leer`);
    setNotifs(p => p.map(n => n.id === id ? { ...n, leida: 1 } : n));
  };

  const marcarTodas = async () => {
    await api.patch('/notificaciones/leer-todas');
    setNotifs(p => p.map(n => ({ ...n, leida: 1 })));
  };

  const tiempoRelativo = (fecha) => {
    const diff = (Date.now() - new Date(fecha)) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const tipoIcon = tipo => ({ stock_bajo:'📦', devolucion:'↩️', orden_compra:'🛒', sistema:'⚙️' }[tipo] || '🔔');

  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <h4>🔔 Notificaciones</h4>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={marcarTodas} style={{ fontSize: 10 }}>Marcar todas</button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="notif-list">
        {loading && <div className="spinner" style={{ margin: '20px auto', width: 18, height: 18 }} />}
        {!loading && notifs.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text4)', fontSize: 12 }}>Sin notificaciones</div>
        )}
        {notifs.map(n => (
          <div key={n.id} className={`notif-item ${!n.leida ? 'unread' : ''}`}
            onClick={() => { if (!n.leida) marcarLeida(n.id); }}>
            <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{tipoIcon(n.tipo)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: n.leida ? 400 : 600, fontSize: 12, marginBottom: 2 }}>{n.titulo}</div>
              {n.mensaje && <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.mensaje}</div>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text4)', flexShrink: 0 }}>{tiempoRelativo(n.creado_en)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Layout principal ─────────────────────────────────────────
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [noLeidas, setNoLeidas] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [sucursales, setSucursales] = useState([]);
  const [sucActiva, setSucActiva]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('sucursal_activa') || 'null'); } catch { return null; }
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall]       = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  const title = document.title;

  // Modo oscuro
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Cerrar notif panel al click fuera
  useEffect(() => {
    const h = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const loadNoLeidas = useCallback(async () => {
    try {
      const { data } = await api.get('/notificaciones/no-leidas');
      setNoLeidas(data.count || 0);
    } catch {}
  }, []);

  useEffect(() => {
    loadNoLeidas();
    const t = setInterval(loadNoLeidas, 60000);
    return () => clearInterval(t);
  }, [loadNoLeidas]);

  // Cargar sucursales (solo admin)
  useEffect(() => {
    if (user?.rol === 'admin') {
      api.get('/sucursales').then(r => setSucursales(r.data)).catch(() => {});
    }
  }, [user]);

  // PWA install prompt
  useEffect(() => {
    const h = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null); setShowInstall(false);
    if (outcome === 'accepted') toast.success('¡App instalada!');
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout(); navigate('/login');
  };

  const cambiarSucursal = (suc) => {
    setSucActiva(suc);
    localStorage.setItem('sucursal_activa', JSON.stringify(suc));
    toast.success(`Sucursal: ${suc ? suc.nombre : 'Todas'}`);
  };

  const isAdmin       = user?.rol === 'admin';
  const isAlmacenista = user?.rol === 'almacenista';
  const isCajero      = user?.rol === 'cajero';
  const isVendedor    = user?.rol === 'vendedor';

  const NavItem = ({ to, iconKey, label, badge }) => (
    <NavLink to={to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      onClick={() => setSidebarOpen(false)}>
      <Icon d={icons[iconKey]} />
      {label}
      {badge > 0 && <span className="nav-notif-badge">{badge > 9 ? '9+' : badge}</span>}
    </NavLink>
  );

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:99 }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <div>
            <span>Inventario Pro</span>
            <small>V7</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Principal</div>
          <NavItem to="/dashboard" iconKey="dash" label="Dashboard" />
          {(isAdmin || isCajero || isVendedor) && <NavItem to="/pos" iconKey="pos" label="Punto de Venta" />}
          <NavItem to="/ventas" iconKey="ventas" label="Ventas" />
          {(isAdmin || isCajero) && <NavItem to="/devoluciones" iconKey="devoluc" label="Devoluciones" />}
          {/* V5: Caja */}
          {(isAdmin || isCajero) && <NavItem to="/caja" iconKey="caja" label="Caja" />}

          <div className="nav-section">Inventario</div>
          {(isAdmin || isAlmacenista) && <NavItem to="/productos" iconKey="prods" label="Productos" />}
          <NavItem to="/inventario" iconKey="inv" label="Inventario" badge={isAdmin ? noLeidas : 0} />
          {(isAdmin || isAlmacenista) && <NavItem to="/ordenes-compra" iconKey="ordenes" label="Órdenes de compra" />}
          {/* V5: Etiquetas */}
          {(isAdmin || isAlmacenista) && <NavItem to="/etiquetas" iconKey="etiqueta" label="Etiquetas" />}

          <div className="nav-section">Gestión</div>
          <NavItem to="/clientes" iconKey="clientes" label="Clientes" />
          {/* V5: Descuentos */}
          {isAdmin && <NavItem to="/descuentos" iconKey="descuento" label="Descuentos" />}

          {isAdmin && (
            <>
              <div className="nav-section">Admin</div>
              {/* V5: Sucursales */}
              <NavItem to="/sucursales" iconKey="sucursal" label="Sucursales" />
              {/* V5: Reportes avanzados */}
              <NavItem to="/reportes-avanzados" iconKey="reporte" label="Reportes avanzados" />
              <NavItem to="/general" iconKey="config" label="Categorías/Prov." />
              <NavItem to="/empresa" iconKey="empresa" label="Mi empresa" />
              <NavItem to="/usuarios" iconKey="usuarios" label="Usuarios" />
              {/* V7: Auditoría */}
              <NavItem to="/auditoria" iconKey="auditoria" label="Auditoría" />
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.nombre?.[0]?.toUpperCase() || '?'}</div>
          <div className="user-info">
            <strong>{user?.nombre || 'Usuario'}</strong>
            <small>{user?.rol}</small>
          </div>
          <button className="dark-toggle" onClick={() => setDark(d => !d)} title="Alternar modo oscuro">
            {dark
              ? <svg viewBox="0 0 24 24"><path d={icons.sun}/></svg>
              : <svg viewBox="0 0 24 24"><path d={icons.moon}/></svg>
            }
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="main">
        <header className="topbar">
          {/* Mobile hamburger */}
          <button className="btn btn-ghost btn-icon mobile-menu-btn"
            style={{ display:'none' }}
            onClick={() => setSidebarOpen(s => !s)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>

          {/* V5: Selector de sucursal (solo admin) */}
          {isAdmin && sucursales.length > 1 && (
            <select
              className="input"
              style={{ maxWidth:180, fontSize:12, padding:'4px 10px', marginLeft:8 }}
              value={sucActiva?.id || ''}
              onChange={e => {
                const suc = sucursales.find(s => s.id === parseInt(e.target.value));
                cambiarSucursal(suc || null);
              }}
            >
              <option value="">🏪 Todas las sucursales</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          )}

          <div style={{ flex:1 }} />

          <div className="topbar-actions">
            {/* PWA Install button */}
            {showInstall && (
              <button className="btn btn-ghost btn-sm" onClick={handleInstall} title="Instalar app"
                style={{ fontSize:11, gap:4 }}>
                📲 Instalar app
              </button>
            )}

            {/* Campana de notificaciones */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="notif-btn"
                onClick={() => { setShowNotif(s => !s); if (!showNotif) loadNoLeidas(); }}
                title="Notificaciones">
                <svg viewBox="0 0 24 24"><path d={icons.bell}/></svg>
                {noLeidas > 0 && <span className="notif-count">{noLeidas > 9 ? '9+' : noLeidas}</span>}
              </button>
              {showNotif && <NotifPanel onClose={() => { setShowNotif(false); loadNoLeidas(); }} />}
            </div>

            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Cerrar sesión">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <path d={icons.logout}/>
              </svg>
              Salir
            </button>
          </div>
        </header>

        <main className="page">
          {children}
        </main>
      </div>
    </div>
  );
}
