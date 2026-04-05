// ══════════════════════════════════════════════════════════════
//  App.jsx  ·  V4 – Rutas + protección por rol
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

// V4
import Devoluciones from './pages/Devoluciones';
import OrdenesCompra from './pages/OrdenesCompra';
import Empresa      from './pages/Empresa';

// ── Protección de ruta ───────────────────────────────────────
function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ margin: '40vh auto' }}/>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Dashboard – todos los roles */}
      <Route path="/dashboard" element={
        <PrivateRoute><Dashboard /></PrivateRoute>
      }/>

      {/* POS – admin, cajero, vendedor */}
      <Route path="/pos" element={
        <PrivateRoute roles={['admin','cajero','vendedor']}><POS /></PrivateRoute>
      }/>

      {/* Ventas – todos */}
      <Route path="/ventas" element={
        <PrivateRoute><Ventas /></PrivateRoute>
      }/>

      {/* V4: Devoluciones – admin, cajero */}
      <Route path="/devoluciones" element={
        <PrivateRoute roles={['admin','cajero']}><Devoluciones /></PrivateRoute>
      }/>

      {/* Productos – admin, almacenista */}
      <Route path="/productos" element={
        <PrivateRoute roles={['admin','almacenista']}><Productos /></PrivateRoute>
      }/>

      {/* Inventario – todos */}
      <Route path="/inventario" element={
        <PrivateRoute><Inventario /></PrivateRoute>
      }/>

      {/* V4: Órdenes de compra – admin, almacenista */}
      <Route path="/ordenes-compra" element={
        <PrivateRoute roles={['admin','almacenista']}><OrdenesCompra /></PrivateRoute>
      }/>

      {/* Clientes – todos */}
      <Route path="/clientes" element={
        <PrivateRoute><Clientes /></PrivateRoute>
      }/>

      {/* General – admin */}
      <Route path="/general" element={
        <PrivateRoute roles={['admin']}><General /></PrivateRoute>
      }/>

      {/* V4: Empresa – admin */}
      <Route path="/empresa" element={
        <PrivateRoute roles={['admin']}><Empresa /></PrivateRoute>
      }/>

      {/* Usuarios – admin */}
      <Route path="/usuarios" element={
        <PrivateRoute roles={['admin']}><Usuarios /></PrivateRoute>
      }/>

      {/* Redirect raíz */}
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