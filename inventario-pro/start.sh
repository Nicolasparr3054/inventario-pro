#!/bin/bash
# ============================================================
#  Inventario Pro V4 — Inicio automático Mac/Linux
# ============================================================

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     INVENTARIO PRO V4 — Iniciando   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js no está instalado. Instálalo desde https://nodejs.org"
  exit 1
fi

# Instalar dependencias backend
echo "📦 Instalando dependencias del backend..."
cd backend
if [ ! -d "node_modules" ]; then
  npm install
fi

# Iniciar backend en background
echo "🚀 Iniciando backend (puerto 3001)..."
npm run dev &
BACKEND_PID=$!

# Instalar dependencias frontend
echo "📦 Instalando dependencias del frontend..."
cd ../frontend
if [ ! -d "node_modules" ]; then
  npm install
fi

# Iniciar frontend
echo "🌐 Iniciando frontend (puerto 5173)..."
echo ""
echo "✅ ¡Listo! Abre http://localhost:5173 en tu navegador"
echo "   Admin: admin@inventariopro.com / password"
echo ""
npm run dev

# Al cerrar frontend, matar backend
kill $BACKEND_PID 2>/dev/null
