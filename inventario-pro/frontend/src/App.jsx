import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Productos  from './pages/Productos';
import POS        from './pages/POS';
import Ventas     from './pages/Ventas';
import Inventario from './pages/Inventario';
import Clientes   from './pages/Clientes';
import { Categorias, Proveedores } from './pages/General';

const Private = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace/>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background:'#181d2e', color:'#e8eaf2', border:'1px solid #1e2540', borderRadius:10, fontSize:13 },
            success: { iconTheme: { primary:'#22d3a0', secondary:'#181d2e' } },
            error:   { iconTheme: { primary:'#ff4d6a', secondary:'#181d2e' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login/>}/>
          <Route path="/"            element={<Private><Dashboard/></Private>}/>
          <Route path="/pos"         element={<Private><POS/></Private>}/>
          <Route path="/ventas"      element={<Private><Ventas/></Private>}/>
          <Route path="/productos"   element={<Private><Productos/></Private>}/>
          <Route path="/inventario"  element={<Private><Inventario/></Private>}/>
          <Route path="/clientes"    element={<Private><Clientes/></Private>}/>
          <Route path="/categorias"  element={<Private><Categorias/></Private>}/>
          <Route path="/proveedores" element={<Private><Proveedores/></Private>}/>
          <Route path="*"            element={<Navigate to="/" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
