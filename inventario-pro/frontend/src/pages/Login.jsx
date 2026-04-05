import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: 'admin@inventariopro.com', password: 'password' });
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      nav('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciales incorrectas');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">
            <div className="login-brand-icon">📦</div>
            <span className="login-brand-name">Inventario Pro</span>
          </div>
          <h2 className="login-headline">Gestión empresarial en un solo lugar</h2>
          <p className="login-sub">Control total de tu inventario, ventas y clientes desde una plataforma profesional.</p>
          <div className="login-features">
            <div className="login-feat"><div className="login-feat-dot" /> Dashboard con KPIs en tiempo real</div>
            <div className="login-feat"><div className="login-feat-dot" /> Punto de venta integrado</div>
            <div className="login-feat"><div className="login-feat-dot" /> Alertas de stock bajo automáticas</div>
            <div className="login-feat"><div className="login-feat-dot" /> Historial completo de ventas</div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <h1 className="login-form-title">Bienvenido</h1>
          <p className="login-form-sub">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label>Correo electrónico</label>
              <input className="input" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="correo@empresa.com" required />
            </div>
            <div className="input-group">
              <label>Contraseña</label>
              <input className="input" type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center', padding: '10px', fontSize: 13 }}>
              {loading ? 'Verificando…' : 'Ingresar al sistema'}
            </button>
          </form>

          <div className="login-divider" />
          <div className="login-hint">
            Acceso demo: <code>admin@inventariopro.com</code><br />
            Contraseña: <code>password</code>
          </div>
        </div>
      </div>
    </div>
  );
}