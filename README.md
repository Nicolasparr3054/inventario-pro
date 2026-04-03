# 📦 Inventario Pro — Sistema de Gestión Empresarial

Sistema profesional de inventario y ventas desarrollado con React + Node.js + MySQL. Funciona desde **cualquier carpeta** del PC (Descargas, Documentos, Escritorio, etc.).

---

## 🚀 Versiones

### V1.0 — Base
- Dashboard con KPIs en tiempo real
- Punto de venta (POS)
- CRUD de productos, clientes, categorías y proveedores
- Historial de ventas
- Control de inventario y stock bajo
- Autenticación con JWT

### V2.0 — Roles y Reportes
- **Sistema de roles**: admin, cajero, vendedor, almacenista
- **Dashboard por rol**: el cajero ve solo sus propias ventas
- **Exportar ventas a CSV** (Excel)
- **Exportar stock a CSV**
- **Gestión de usuarios** desde la aplicación
- **Historial de precios** por producto
- Ventas registran el vendedor que las realizó

### V3.0 — Experiencia Completa
- **Recibo de venta** con botón de impresión al confirmar cada venta
- **Escáner de código de barras** integrado en el POS (compatible con lectores USB)
- **Imagen de productos** — sube foto por URL o desde tu computador
- **Historial de accesos** — quién entró al sistema, cuándo y desde qué IP
- **Log de login fallido** — intentos fallidos quedan registrados

---

## 🛠️ REQUISITOS PREVIOS

### 1. Instalar Node.js
- Descargar desde: https://nodejs.org (versión LTS recomendada)
- Verificar instalación: abrir CMD/Terminal y escribir `node -v`

### 2. Instalar XAMPP (para MySQL)
- Descargar desde: https://www.apachefriends.org
- Abrir XAMPP Control Panel
- Iniciar **solo MySQL** (no necesitas Apache)

### 3. Configurar la base de datos
1. Abrir **MySQL Workbench** o **phpMyAdmin**
2. Ejecutar el archivo `database.sql`
3. Si vienes de V1: ejecutar también `migration_v2.sql`
4. Si vienes de V2: ejecutar también `migration_v3.sql`

---

## ▶️ INICIAR EL SISTEMA

### Windows
```bash
# Doble clic en:
start.bat
```

### Mac / Linux
```bash
chmod +x start.sh
./start.sh
```

### Manual
```bash
# Terminal 1 — Backend
cd inventario-pro/backend
npm install
npm start

# Terminal 2 — Frontend
cd inventario-pro/frontend
npm install
npm run dev
```

Luego abrir en el navegador: **http://localhost:5173**

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
inventario-pro/
├── backend/                  ← API REST Node.js/Express
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js   ← Configuración MySQL
│   │   ├── controllers/      ← Lógica de negocio
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── productosController.js
│   │   │   ├── ventasController.js
│   │   │   ├── generalController.js
│   │   │   ├── reportesController.js
│   │   │   └── usuariosController.js
│   │   ├── middleware/
│   │   │   └── auth.js       ← Autenticación JWT + roles
│   │   ├── routes/
│   │   │   └── index.js      ← Todas las rutas API
│   │   └── index.js          ← Servidor Express
│   ├── .env                  ← Variables de entorno
│   └── package.json
│
├── frontend/                 ← Aplicación React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx    ← Sidebar + topbar
│   │   ├── hooks/
│   │   │   └── useAuth.jsx   ← Contexto de autenticación
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx ← KPIs + gráficas (vista por rol)
│   │   │   ├── POS.jsx       ← Punto de venta + escáner + recibo
│   │   │   ├── Productos.jsx ← CRUD productos + imágenes
│   │   │   ├── Ventas.jsx    ← Historial + exportar CSV
│   │   │   ├── Inventario.jsx← Stock bajo
│   │   │   ├── Clientes.jsx  ← CRUD clientes
│   │   │   ├── Usuarios.jsx  ← Gestión usuarios + historial accesos
│   │   │   └── General.jsx   ← Categorías/Proveedores
│   │   ├── utils/
│   │   │   ├── api.js        ← Cliente HTTP (axios)
│   │   │   └── format.js     ← Formateo de moneda/fechas
│   │   ├── App.jsx           ← Rutas + protección por rol
│   │   ├── index.css         ← Estilos globales
│   │   └── main.jsx
│   └── package.json
│
├── database.sql              ← Script base MySQL (V1)
├── migration_v2.sql          ← Migración V2
├── migration_v3.sql          ← Migración V3
├── start.bat                 ← Inicio automático Windows
├── start.sh                  ← Inicio automático Mac/Linux
└── README.md
```

---

## 🔐 ROLES DE USUARIO

| Rol | Acceso |
|---|---|
| **Admin** | Acceso total — dashboard global, usuarios, reportes, configuración |
| **Cajero** | Solo punto de venta y sus propias ventas |
| **Vendedor** | Punto de venta, ventas y productos |
| **Almacenista** | Productos e inventario |

---

## 👤 ACCESO DEMO

| Campo | Valor |
|---|---|
| Email | `admin@inventariopro.com` |
| Contraseña | `password` |

| Campo | Valor |
|---|---|
| Email | `cajero@inventariopro.com` |
| Contraseña | `password` |

---

## 🧰 TECH STACK

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite + Recharts |
| Backend | Node.js + Express |
| Base de datos | MySQL |
| Autenticación | JWT + bcrypt |
| Estilos | CSS personalizado |

---

## 📊 FUNCIONALIDADES PRINCIPALES

- ✅ Dashboard con KPIs, gráficas y comparativo mensual
- ✅ Punto de venta con escáner de código de barras
- ✅ Recibo de venta imprimible
- ✅ Imágenes de productos (URL o archivo local)
- ✅ Exportar ventas y stock a CSV (Excel)
- ✅ Historial de accesos y log de seguridad
- ✅ Alertas automáticas de stock bajo
- ✅ Historial de cambios de precios
- ✅ Sistema de roles y permisos
- ✅ Gestión completa de usuarios

---

## 📝 VARIABLES DE ENTORNO

Archivo `backend/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=inventario_pro
DB_PORT=3306
JWT_SECRET=inventario_pro_secret_key
JWT_EXPIRES=8h
PORT=3001
```

---

*Desarrollado con React + Node.js + MySQL*
