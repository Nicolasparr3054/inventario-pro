import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { initials } from '../utils/format';

const icons = {
  dashboard:  <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  pos:        <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  ventas:     <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  productos:  <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  inventario: <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  clientes:   <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  categorias: <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  proveedores:<svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  usuarios:   <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/><line x1="18" y1="8" x2="23" y2="8"/><line x1="18" y1="11" x2="23" y2="11"/></svg>,
};

export default function Layout({ children, title, alertCount }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const doLogout = () => { logout(); nav('/login'); };

  const isAdmin  = user?.rol === 'admin';
  const isCajero = user?.rol === 'cajero';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" style={{width:15,height:15,stroke:'#a0a0a8',fill:'none',strokeWidth:1.8,strokeLinecap:'round',strokeLinejoin:'round'}}>
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <div>
            <span>Inventario Pro</span>
            <small>v2.0</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Principal — todos los roles */}
          <div className="nav-section">PRINCIPAL</div>
          <NavLink to="/" end className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.dashboard} Dashboard</NavLink>
          <NavLink to="/pos"    className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.pos} Punto de Venta</NavLink>

          {/* Gestión — admin y no-cajero */}
          {!isCajero && (<>
            <div className="nav-section">GESTIÓN</div>
            <NavLink to="/ventas"     className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.ventas} Ventas</NavLink>
            <NavLink to="/productos"  className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.productos} Productos</NavLink>
            <NavLink to="/inventario" className={({isActive})=>`nav-item ${isActive?'active':''}`}>
              {icons.inventario} Inventario
              {alertCount > 0 && <span className="nav-badge" style={{background:'var(--amber)'}}/>}
            </NavLink>
          </>)}

          {/* Cajero: solo ve sus ventas */}
          {isCajero && (<>
            <div className="nav-section">GESTIÓN</div>
            <NavLink to="/ventas" className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.ventas} Mis Ventas</NavLink>
          </>)}

          {/* Registros — solo admin */}
          {isAdmin && (<>
            <div className="nav-section">REGISTROS</div>
            <NavLink to="/clientes"    className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.clientes} Clientes</NavLink>
            <NavLink to="/categorias"  className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.categorias} Categorías</NavLink>
            <NavLink to="/proveedores" className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.proveedores} Proveedores</NavLink>
          </>)}

          {/* Administración — solo admin */}
          {isAdmin && (<>
            <div className="nav-section">ADMINISTRACIÓN</div>
            <NavLink to="/usuarios" className={({isActive})=>`nav-item ${isActive?'active':''}`}>{icons.usuarios} Usuarios</NavLink>
          </>)}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{initials(user?.nombre || 'U')}</div>
          <div className="user-info">
            <strong>{user?.nombre}</strong>
            <small>{user?.rol}</small>
          </div>
          <button onClick={doLogout} className="btn btn-ghost btn-icon btn-sm" title="Cerrar sesión">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <h1>{title}</h1>
          <div className="topbar-actions">
            {alertCount > 0 && (
              <span className="topbar-alert">⚠ {alertCount} stock bajo</span>
            )}
            <span style={{fontSize:11, color:'var(--text3)'}}>
              {new Date().toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long'})}
            </span>
          </div>
        </div>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}