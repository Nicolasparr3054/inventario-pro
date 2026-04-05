# 📦 Inventario Pro

> Sistema profesional de gestión de inventario y punto de venta desarrollado con React + Node.js + MySQL.

![Version](https://img.shields.io/badge/version-4.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## ✨ Demo rápido

```
URL:        http://localhost:5173
Admin:      admin@inventariopro.com  /  password
Cajero:     cajero@inventariopro.com /  password
```

---

## 🗂️ Historial de versiones

### V4.0 — Suite Completa *(actual)*
- ↩️ **Devoluciones de ventas** con restitución automática de stock
- 🛒 **Órdenes de compra** a proveedores con flujo Borrador → Enviada → Recibida
- 🧾 **Factura PDF** con logo y datos de empresa configurables
- 💬 **Envío de recibo por WhatsApp** con mensaje pre-formateado
- 🌙 **Modo oscuro completo** con preferencia guardada
- 🔔 **Notificaciones en tiempo real** de stock bajo

### V3.0 — Experiencia Completa
- 🖨️ Recibo de venta imprimible al confirmar cada venta
- 📷 Escáner de código de barras en POS (lectores USB)
- 🖼️ Imagen de productos por URL o archivo local
- 🔒 Historial de accesos y log de seguridad por IP

### V2.0 — Roles y Reportes
- 👥 Sistema de roles: admin, cajero, vendedor, almacenista
- 📊 Dashboard diferente por rol
- 📤 Exportar ventas y stock a CSV
- 💰 Historial de cambios de precios por producto
- 👤 Gestión de usuarios desde la aplicación

### V1.0 — Base
- 📈 Dashboard con KPIs y gráficas
- 🛍️ Punto de venta (POS)
- 📦 CRUD de productos, clientes, categorías y proveedores
- 📋 Historial de ventas
- ⚠️ Control de inventario y alertas de stock bajo
- 🔐 Autenticación con JWT

---

## 🧰 Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + Recharts |
| Backend | Node.js 18+ + Express 4 |
| Base de datos | MySQL 8+ |
| Autenticación | JWT + bcrypt |
| Estilos | CSS custom (sin Tailwind) |
| Notificaciones | react-hot-toast |
| Iconos | Lucide React |

---

## 📋 Requisitos previos

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Node.js | 18 LTS | [nodejs.org](https://nodejs.org) |
| MySQL | 8.0 | [XAMPP](https://www.apachefriends.org) o [MySQL Community](https://dev.mysql.com/downloads/) |
| MySQL Workbench | cualquiera | [dev.mysql.com](https://dev.mysql.com/downloads/workbench/) |

---

## 🚀 Instalación

### 1. Clonar / descomprimir el proyecto

```bash
git clone https://github.com/tu-usuario/inventario-pro.git
cd inventario-pro
```

### 2. Configurar la base de datos

Abre **MySQL Workbench** y ejecuta:

```sql
-- Instalación nueva (borra y recrea todo):
source database_completo_v4.sql

-- Si ya tienes V3 instalada, solo ejecuta:
source migration_v4.sql
```

Al terminar debes ver:
```
✅ Base de datos creada correctamente
   Tablas: 15
   Usuarios: 2
   Productos: 6
```

### 3. Configurar variables de entorno

Edita `backend/.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=inventario_pro
JWT_SECRET=cambia_esto_por_una_clave_segura
JWT_EXPIRES=8h
```

### 4. Iniciar el sistema

**Windows:**
```
Doble clic en start.bat
```

**Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Manual (2 terminales):**
```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```

Abre: **http://localhost:5173**

---

## 🗂️ Estructura del proyecto

```
inventario-pro/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── devolucionesController.js   ← V4
│   │   │   ├── facturaController.js        ← V4
│   │   │   ├── generalController.js
│   │   │   ├── ordenesCompraController.js  ← V4
│   │   │   ├── productosController.js
│   │   │   ├── reportesController.js
│   │   │   ├── usuariosController.js
│   │   │   └── ventasController.js
│   │   ├── middleware/auth.js
│   │   ├── routes/index.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/Layout.jsx      ← Sidebar + modo oscuro + notifs
│   │   ├── hooks/useAuth.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Devoluciones.jsx       ← V4
│   │   │   ├── Empresa.jsx            ← V4
│   │   │   ├── General.jsx
│   │   │   ├── Inventario.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OrdenesCompra.jsx      ← V4
│   │   │   ├── POS.jsx
│   │   │   ├── Productos.jsx
│   │   │   ├── Ventas.jsx
│   │   │   ├── Clientes.jsx
│   │   │   └── Usuarios.jsx
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── format.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── database_completo_v4.sql  ← ⭐ Ejecutar este para instalación nueva
├── database.sql
├── migration_v2.sql
├── migration_v3.sql
├── migration_v4.sql
├── start.bat
├── start.sh
└── README.md
```

---

## 🔐 Roles y permisos

| Sección | Admin | Cajero | Vendedor | Almacenista |
|---------|:-----:|:------:|:--------:|:-----------:|
| Dashboard | ✅ global | ✅ propio | ✅ | ✅ |
| Punto de Venta | ✅ | ✅ | ✅ | ❌ |
| Ventas | ✅ | ✅ | ✅ | ✅ |
| Devoluciones | ✅ | ✅ | ❌ | ❌ |
| Productos | ✅ | ❌ | ❌ | ✅ |
| Inventario | ✅ | ✅ | ✅ | ✅ |
| Órdenes de compra | ✅ | ❌ | ❌ | ✅ |
| Clientes | ✅ | ✅ | ✅ | ✅ |
| Mi empresa | ✅ | ❌ | ❌ | ❌ |
| Usuarios | ✅ | ❌ | ❌ | ❌ |

---

## 🗄️ Tablas de la base de datos

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Cuentas con roles |
| `categorias` | Categorías de productos |
| `proveedores` | Proveedores / distribuidores |
| `productos` | Catálogo con precios y stock |
| `clientes` | Clientes registrados |
| `ventas` | Cabecera de cada venta |
| `venta_detalles` | Ítems de cada venta |
| `movimientos_inventario` | Log de entradas/salidas |
| `historial_precios` | Cambios de precio por producto |
| `codigos_barras` | Códigos adicionales por producto |
| `accesos_log` | Login / logout / intentos fallidos |
| `devoluciones` | Cabecera de devoluciones *(V4)* |
| `devolucion_detalles` | Ítems devueltos *(V4)* |
| `ordenes_compra` | Órdenes a proveedores *(V4)* |
| `orden_compra_detalles` | Ítems de cada orden *(V4)* |
| `empresa_config` | Datos empresa para facturas *(V4)* |
| `notificaciones` | Alertas de stock y sistema *(V4)* |

---

## 📡 API Reference

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuario actual |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Listar todos |
| GET | `/api/productos/stock-bajo` | Stock bajo mínimo |
| GET | `/api/productos/buscar-codigo?codigo=X` | Buscar por código / barcode |
| GET | `/api/productos/:id` | Obtener uno |
| POST | `/api/productos` | Crear |
| PUT | `/api/productos/:id` | Actualizar |
| PATCH | `/api/productos/:id/stock` | Ajustar stock |
| GET | `/api/productos/:id/precios` | Historial de precios |

### Ventas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ventas` | Listar con filtros |
| GET | `/api/ventas/:id` | Detalle completo |
| POST | `/api/ventas` | Crear venta |
| GET | `/api/ventas/:id/recibo` | Datos del recibo |
| GET | `/api/ventas/:id/factura` | Factura HTML/PDF |

### Devoluciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/devoluciones` | Listar |
| GET | `/api/devoluciones/:id` | Detalle |
| POST | `/api/devoluciones` | Crear (restituye stock) |

### Órdenes de compra
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ordenes-compra` | Listar |
| GET | `/api/ordenes-compra/:id` | Detalle |
| POST | `/api/ordenes-compra` | Crear |
| PUT | `/api/ordenes-compra/:id` | Editar borrador |
| PATCH | `/api/ordenes-compra/:id/estado` | Cambiar estado |

### Empresa y Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/empresa/config` | Leer configuración |
| PUT | `/api/empresa/config` | Guardar configuración |
| GET | `/api/notificaciones` | Listar notificaciones |
| GET | `/api/notificaciones/no-leidas` | Conteo no leídas |
| PATCH | `/api/notificaciones/:id/leer` | Marcar una leída |
| PATCH | `/api/notificaciones/leer-todas` | Marcar todas leídas |
| POST | `/api/notificaciones/verificar-stock` | Generar alertas stock |

---

## 🔧 Solución de problemas

| Error | Causa | Solución |
|-------|-------|---------|
| `Access denied for user 'root'` | Contraseña MySQL incorrecta | Editar `DB_PASSWORD` en `backend/.env` |
| `ECONNREFUSED` | Backend caído | Revisar la terminal del backend |
| `Credenciales incorrectas` | Usuario no existe en BD | Ejecutar `database_completo_v4.sql` |
| `expiresIn should be a number` | Falta `JWT_EXPIRES` en `.env` | Agregar `JWT_EXPIRES=8h` |
| `Token requerido` en factura | URL abierta sin sesión | Usar el botón 🧾 desde la app |
| Puerto 3001 ocupado | Otro proceso en ese puerto | Cambiar `PORT` en `.env` |

---

## 📁 .gitignore recomendado

```gitignore
node_modules/
.env
.env.local
dist/
build/
.DS_Store
Thumbs.db
*.log
```

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'feat: descripción del cambio'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abrir Pull Request

**Convención de commits:**
```
feat:     nueva funcionalidad
fix:      corrección de bug
docs:     documentación
refactor: refactorización sin cambio de funcionalidad
```

---

## 📄 Licencia

MIT © 2024 — Inventario Pro

---

*Desarrollado con ❤️ usando React + Node.js + MySQL*
