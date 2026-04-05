@echo off
REM ============================================================
REM  Inventario Pro V4 — Inicio automático Windows
REM ============================================================

echo.
echo ╔══════════════════════════════════════╗
echo ║     INVENTARIO PRO V4 — Iniciando   ║
echo ╚══════════════════════════════════════╝
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo ❌ Node.js no está instalado. Instálalo desde https://nodejs.org
  pause
  exit /b 1
)

REM Instalar dependencias backend si hace falta
cd backend
if not exist "node_modules" (
  echo 📦 Instalando dependencias del backend...
  call npm install
)

REM Iniciar backend en nueva ventana
echo 🚀 Iniciando backend en puerto 3001...
start "Backend - Inventario Pro" cmd /k "npm run dev"

REM Volver a raíz e ir a frontend
cd ..\frontend
if not exist "node_modules" (
  echo 📦 Instalando dependencias del frontend...
  call npm install
)

echo.
echo ✅ ¡Listo! Abre http://localhost:5173 en tu navegador
echo    Admin: admin@inventariopro.com / password
echo.

REM Iniciar frontend en nueva ventana
start "Frontend - Inventario Pro" cmd /k "npm run dev"

echo Las ventanas del backend y frontend están abiertas.
echo Cierra esta ventana cuando quieras detener todo.
pause
