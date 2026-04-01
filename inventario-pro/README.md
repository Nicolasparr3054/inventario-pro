# 📦 Inventario Pro — Sistema de Gestión Empresarial

Sistema profesional de inventario y ventas desarrollado con React + Node.js + MySQL.
Funciona desde **cualquier carpeta** del PC (Descargas, Documentos, Escritorio, etc.).

---

## 🛠️ REQUISITOS PREVIOS

### 1. Instalar Node.js
- Descargar desde: https://nodejs.org (versión LTS recomendada)
- Verificar instalación: abrir CMD/Terminal y escribir `node -v`

### 2. Instalar XAMPP (para MySQL)
- Descargar desde: https://www.apachefriends.org
- Abrir XAMPP Control Panel
- Iniciar **solo MySQL** (no necesitas Apache)

### 3. Extensiones recomendadas en Visual Studio Code
Instalar estas extensiones en VS Code (Ctrl+Shift+X):
- **ES7+ React/Redux/React-Native snippets** (dsznajder)
- **Prettier - Code formatter** (esbenp)
- **ESLint** (Microsoft)
- **GitLens** (GitKraken)
- **Thunder Client** — para probar la API (opcional)
- **MySQL** (cweijan) — para ver la BD desde VS Code

---

## 🗄️ CONFIGURAR BASE DE DATOS

1. Abre **XAMPP Control Panel** e inicia **MySQL**
2. Abre **MySQL Workbench**
3. Conecta a `localhost` con usuario `root` y contraseña `123456`
4. Abre el archivo `database.sql` de este proyecto
5. Ejecuta todo el script (Ctrl+Shift+Enter o botón ⚡ Execute All)
6. Verifica que se creó la base de datos `inventario_pro`

---

## 🚀 INSTALACIÓN Y ARRANQUE

### Opción A — Script automático (más fácil)

**Windows:**
1. Doble clic en `start.bat`
2. Espera a que instale dependencias (solo la primera vez)
3. Se abre el navegador automáticamente en http://localhost:5173

**Mac / Linux:**
1. Abrir Terminal en la carpeta del proyecto
2. Ejecutar: `chmod +x start.sh && ./start.sh`

---

### Opción B — Manual (desde VS Code)

**Terminal 1 — Backend:**
```bash
cd backend
npm install          # Solo la primera vez
npm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install          # Solo la primera vez
npm run dev
```

Luego abrir: **http://localhost:5173**

---

## 🔐 CREDENCIALES DE ACCESO

| Campo    | Valor                      |
|----------|----------------------------|
| Email    | admin@inventariopro.com    |
| Contraseña | password                 |

---

## 📂 ESTRUCTURA DEL PROYECTO

```
inventario-pro/
├── backend/                  ← API REST Node.js/Express
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js   ← Configuración MySQL
│   │   ├── controllers/      ← Lógica de negocio
│   │   ├── middleware/
│   │   │   └── auth.js       ← Autenticación JWT
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
│   │   │   ├── Dashboard.jsx ← KPIs + gráficas
│   │   │   ├── POS.jsx       ← Punto de venta
│   │   │   ├── Productos.jsx ← CRUD productos
│   │   │   ├── Ventas.jsx    ← Historial ventas
│   │   │   ├── Inventario.jsx← Stock bajo
│   │   │   ├── Clientes.jsx  ← CRUD clientes
│   │   │   └── General.jsx   ← Categorías/Proveedores
│   │   ├── utils/
│   │   │   ├── api.js        ← Cliente HTTP (axios)
│   │   │   └── format.js     ← Formateo de moneda/fechas
│   │   ├── App.jsx           ← Rutas
│   │   ├── index.css         ← Estilos globales
│   │   └── main.jsx
│   └── package.json
│
├── database.sql              ← Script completo MySQL
├── start.bat                 ← Inicio automático Windows
├── start.sh                  ← Inicio automático Mac/Linux
└── README.md
```

---

## ⚙️ CONFIGURACIÓN (.env)

Si cambias la contraseña de MySQL, edita `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456   ← Cambia aquí
DB_NAME=inventario_pro
JWT_SECRET=inventariopro_super_secret_key_2024_cambiar_en_produccion
```

---

## 🌟 MÓDULOS DEL SISTEMA

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | KPIs del día, gráficas de ventas semanales, top productos, movimientos recientes |
| **Punto de Venta** | Interfaz de caja rápida, carrito, descuentos, métodos de pago |
| **Ventas** | Historial completo con filtros, detalle por venta |
| **Productos** | CRUD completo, búsqueda, filtros, ajuste de stock |
| **Inventario** | Alertas de stock bajo, entradas rápidas |
| **Clientes** | CRUD de clientes con NIT, email, teléfono |
| **Categorías** | Organización por categorías con colores |
| **Proveedores** | Registro de proveedores |

---

## 🔧 SOLUCIÓN DE PROBLEMAS

**MySQL no conecta:**
- Verifica que XAMPP tiene MySQL iniciado (fondo verde)
- Confirma que la contraseña en `.env` coincide con la de MySQL

**Puerto en uso:**
- Backend usa puerto **3001** — si está ocupado, cambia `PORT=3001` en `.env`
- Frontend usa puerto **5173** — Vite lo cambia automáticamente si está ocupado

**Error de CORS:**
- No abras el frontend desde un archivo HTML directamente
- Siempre usa `npm run dev` y accede por `http://localhost:5173`

---

## 💰 LICENCIA

Software propietario. Todos los derechos reservados.
Desarrollado como solución comercial para pymes.
