// ══════════════════════════════════════════════════════════════
//  App.jsx  ·  V5 – Rutas + protección por rol
// ══════════════════════════════════════════════════════════════
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import POS          from './pages/POS';
import Productos    from './pages/Productos';
import Ventas       from './pages/Ventas';
import Inventario   from './pages/Inventario';
import Clientes     from './pages/Clientes';
import Usuarios     from './pages/Usuarios';
import General      from './pages/General';
import Devoluciones from './pages/Devoluciones';
import OrdenesCompra from './pages/OrdenesCompra';
import Empresa      from './pages/Empresa';
// V5
import Sucursales       from './pages/Sucursales';
import ReportesAvanzados from './pages/ReportesAvanzados';
import Descuentos       from './pages/Descuentos';
import Caja             from './pages/Caja';
import Etiquetas        from './pages/Etiquetas';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ margin: '40vh auto' }}/>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>}/>

      <Route path="/pos" element={
        <PrivateRoute roles={['admin','cajero','vendedor']}><POS /></PrivateRoute>
      }/>

      <Route path="/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>}/>

      <Route path="/devoluciones" element={
        <PrivateRoute roles={['admin','cajero']}><Devoluciones /></PrivateRoute>
      }/>

      <Route path="/productos" element={
        <PrivateRoute roles={['admin','almacenista']}><Productos /></PrivateRoute>
      }/>

      <Route path="/inventario" element={<PrivateRoute><Inventario /></PrivateRoute>}/>

      <Route path="/ordenes-compra" element={
        <PrivateRoute roles={['admin','almacenista']}><OrdenesCompra /></PrivateRoute>
      }/>

      <Route path="/clientes" element={<PrivateRoute><Clientes /></PrivateRoute>}/>

      <Route path="/general" element={
        <PrivateRoute roles={['admin']}><General /></PrivateRoute>
      }/>

      <Route path="/empresa" element={
        <PrivateRoute roles={['admin']}><Empresa /></PrivateRoute>
      }/>

      <Route path="/usuarios" element={
        <PrivateRoute roles={['admin']}><Usuarios /></PrivateRoute>
      }/>

      {/* ── V5 ─────────────────────────────── */}
      <Route path="/sucursales" element={
        <PrivateRoute roles={['admin']}><Sucursales /></PrivateRoute>
      }/>

      <Route path="/reportes-avanzados" element={
        <PrivateRoute roles={['admin']}><ReportesAvanzados /></PrivateRoute>
      }/>

      <Route path="/descuentos" element={
        <PrivateRoute roles={['admin']}><Descuentos /></PrivateRoute>
      }/>

      <Route path="/caja" element={
        <PrivateRoute roles={['admin','cajero']}><Caja /></PrivateRoute>
      }/>

      <Route path="/etiquetas" element={
        <PrivateRoute roles={['admin','almacenista']}><Etiquetas /></PrivateRoute>
      }/>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text)',
              border: '0.5px solid var(--border)',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'var(--font)',
              boxShadow: 'var(--shadow)',
            },
            success: { iconTheme: { primary: 'var(--green)', secondary: '#fff' } },
            error:   { iconTheme: { primary: 'var(--red)',   secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
