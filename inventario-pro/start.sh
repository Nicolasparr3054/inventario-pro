#!/bin/bash
echo ""
echo "============================================"
echo "  INVENTARIO PRO - Sistema de Gestion"
echo "============================================"
echo ""

DIR="$(cd "$(dirname "$0")" && pwd)"

# Backend deps
echo "[1/3] Instalando dependencias del backend..."
cd "$DIR/backend"
[ ! -d node_modules ] && npm install

# Frontend deps
echo "[2/3] Instalando dependencias del frontend..."
cd "$DIR/frontend"
[ ! -d node_modules ] && npm install

# Start backend
echo "[3/3] Iniciando servidores..."
cd "$DIR/backend"
osascript -e 'tell app "Terminal" to do script "cd \"'"$DIR/backend"'\" && node src/index.js"' 2>/dev/null || \
  gnome-terminal -- bash -c "cd '$DIR/backend' && node src/index.js; exec bash" 2>/dev/null || \
  xterm -e "cd '$DIR/backend' && node src/index.js" &

sleep 2

# Start frontend
cd "$DIR/frontend"
osascript -e 'tell app "Terminal" to do script "cd \"'"$DIR/frontend"'\" && npm run dev"' 2>/dev/null || \
  gnome-terminal -- bash -c "cd '$DIR/frontend' && npm run dev; exec bash" 2>/dev/null || \
  xterm -e "cd '$DIR/frontend' && npm run dev" &

sleep 3

echo ""
echo "============================================"
echo "  App lista!"
echo "  Frontend: http://localhost:5173"
echo "  API:      http://localhost:3001"
echo "============================================"
echo ""
echo "  Usuario: admin@inventariopro.com"
echo "  Contraseña: password"
echo ""

# Abrir browser
open http://localhost:5173 2>/dev/null || xdg-open http://localhost:5173 2>/dev/null
