export const fmt = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
export const fmtNum = n => new Intl.NumberFormat('es-CO').format(n || 0);
export const fmtDate = d => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
export const fmtDateTime = d => d ? new Date(d).toLocaleString('es-CO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '-';
export const initials = name => name?.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase() || '?';
