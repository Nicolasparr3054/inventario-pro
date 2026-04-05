import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ── Error Boundary para mostrar errores en pantalla ──────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('CRASH:', error, info);
  }
  render() {
    if (this.state.hasError) {
      const e = this.state.error;
      const stack = this.state.info?.componentStack || '';
      return (
        <div style={{
          fontFamily: 'monospace', padding: 32, background: '#fff',
          minHeight: '100vh', color: '#1c1c1e'
        }}>
          <div style={{
            background: '#fdf0f0', border: '2px solid #ef4444',
            borderRadius: 10, padding: 24, maxWidth: 800, margin: '0 auto'
          }}>
            <h2 style={{ color: '#ef4444', marginBottom: 12, fontSize: 18 }}>
              ❌ Error en la aplicación
            </h2>
            <div style={{
              background: '#fff', borderRadius: 8, padding: 16,
              marginBottom: 16, border: '1px solid #fdd'
            }}>
              <strong style={{ color: '#c0392b' }}>
                {e?.name}: {e?.message}
              </strong>
            </div>
            <details open>
              <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>
                Stack trace (copia esto y compártelo)
              </summary>
              <pre style={{
                background: '#f5f4f2', borderRadius: 8, padding: 12,
                fontSize: 11, overflow: 'auto', maxHeight: 300,
                whiteSpace: 'pre-wrap', wordBreak: 'break-all'
              }}>
                {e?.stack}
              </pre>
            </details>
            {stack && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>
                  Componente que falló
                </summary>
                <pre style={{
                  background: '#f5f4f2', borderRadius: 8, padding: 12,
                  fontSize: 11, overflow: 'auto', maxHeight: 200,
                  whiteSpace: 'pre-wrap'
                }}>
                  {stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 20, padding: '10px 20px', background: '#3a7aff',
                color: '#fff', border: 'none', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontFamily: 'monospace'
              }}
            >
              🔄 Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);