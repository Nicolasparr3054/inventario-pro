@echo off
title Inventario Pro - Iniciando...
color 0A
echo.
echo  ============================================
echo    INVENTARIO PRO - Sistema de Gestion
echo  ============================================
echo.

:: Verificar Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js no esta instalado.
  echo Descargalo en: https://nodejs.org
  pause
  exit /b 1
)

echo [1/3] Instalando dependencias del backend...
cd /d "%~dp0backend"
if not exist node_modules (
  call npm install
)

echo.
echo [2/3] Instalando dependencias del frontend...
cd /d "%~dp0frontend"
if not exist node_modules (
  call npm install
)

echo.
echo [3/3] Iniciando servidores...
cd /d "%~dp0backend"
start "Backend API - Puerto 3001" cmd /k "node src/index.js"

timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend"
start "Frontend - Puerto 5173" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo  ============================================
echo    Aplicacion iniciada correctamente!
echo    Frontend: http://localhost:5173
echo    API:      http://localhost:3001
echo  ============================================
echo.
echo  Usuario: admin@inventariopro.com
echo  Contrasena: password
echo.
start http://localhost:5173
pause
