# 📦 Inventario Pro

> Sistema profesional de gestión de inventario y punto de venta desarrollado con React + Node.js + MySQL.

![Version](https://img.shields.io/badge/version-7.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## ✨ Demo rápido

\`\`\`
URL:        http://localhost:5173
Admin:      admin@inventariopro.com  /  password
Cajero:     cajero@inventariopro.com /  password
\`\`\`

---

## 🗂️ Historial de versiones

### V7.0 — Seguridad, Automatización y Comunicación *(actual)*
- 🌙 **Modo oscuro / claro mejorado** con detección automática de preferencia del sistema operativo y persistencia entre sesiones
- 📋 **Log de auditoría** — registro automático de acciones críticas: cambios de precio, creación, modificación y eliminación de usuarios. Página exclusiva para admin con filtros por acción y fecha
- 📲 **WhatsApp mejorado** — el mensaje de recibo ahora incluye el link directo a la factura PDF para que el cliente la vea en su navegador
- 🏧 **Caja automática** — al realizar una venta o devolución con un turno de caja abierto, el movimiento se registra automáticamente sin pasos manuales

### V6.0 — Comunicación y Productividad
- 📧 **Envío de factura por email** directamente desde el historial de ventas y el punto de venta, usando Nodemailer con soporte SMTP/Gmail
- 📥 **Exportar reportes a Excel** (.xlsx) desde Reportes Avanzados: rentabilidad, top 10 del mes y comparativo mensual
- 🔖 **Código de barras automático** al crear productos (formato \`PROD-XXXXXXXX\`) con botón para regenerar

### V5.0 — Suite Empresarial
- 🏪 **Multi-Sucursal** con stock independiente por sucursal y vista consolidada para admin
- 📱 **App Móvil PWA** instalable con escáner de cámara y modo offline básico
- 📊 **Reportes Avanzados** exportables a PDF: rentabilidad, top ventas, comparativo mensual
- 🏷️ **Descuentos y Promociones** por código, categoría, producto o cliente con vigencia y límite de usos
- 🏧 **Control de Caja / Turnos** con apertura, movimientos manuales y cuadre al cierre
- 🖨️ **Generador de Etiquetas** con código de barras real (CODE128) e impresión directa

### V4.0 — Suite Completa
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
| Códigos de barras | JsBarcode (CDN) |
| Escáner cámara | html5-qrcode (CDN) |
| Excel export | SheetJS / xlsx (CDN) |
| Email | Nodemailer + SMTP/Gmail |
| PWA | manifest.json + Service Worker |

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

\`\`\`bash
git clone https://github.com/tu-usuario/inventario-pro.git
cd inventario-pro
\`\`\`

### 2. Configurar la base de datos

Abre **MySQL Workbench** y ejecuta en orden:

\`\`\`sql
-- Instalación nueva (borra y recrea todo):
source database_completo_v4.sql
source migration_v5.sql
source migration_v6.sql

-- Si ya tienes V5 instalada, solo ejecuta:
source migration_v6.sql
\`\`\`

### 3. Configurar variables de entorno

Edita el archivo \`backend/.env\`:

\`\`\`env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=inventario_pro
JWT_SECRET=cambia_esto_por_una_clave_segura
JWT_EXPIRES=8h

# V6 — Configuración SMTP para envío de facturas por email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
\`\`\`

> ⚠️ **Gmail:** El campo \`SMTP_PASS\` debe ser una **contraseña de aplicación**, no tu contraseña normal. Generala en: Google Account → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones.

> ⚠️ **Importante:** Nunca compartas este archivo públicamente. Cada instalación debe tener su propia contraseña y \`JWT_SECRET\`.

### 4. Instalar dependencias

\`\`\`bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
\`\`\`

### 5. Iniciar el sistema

**Windows:**
\`\`\`
Doble clic en start.bat
\`\`\`

**Mac / Linux:**
\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

**Manual (2 terminales):**
\`\`\`bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
\`\`\`

Abre: **http://localhost:5173**

---

## 🗂️ Estructura del proyecto

```
inventario-pro/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   │   ├── auditoriaController.js         ← V7 nuevo
│   │   │   ├── authController.js
│   │   │   ├── cajaController.js              ← V5
│   │   │   ├── dashboardController.js
│   │   │   ├── descuentosController.js        ← V5
│   │   │   ├── devolucionesController.js      ← V7 caja automática
│   │   │   ├── etiquetasController.js         ← V5
│   │   │   ├── facturaController.js           ← V6 enviarFacturaPorEmail
│   │   │   ├── generalController.js
│   │   │   ├── ordenesCompraController.js
│   │   │   ├── productosController.js         ← V7 auditoría precios
│   │   │   ├── reportesAvanzadosController.js ← V5
│   │   │   ├── reportesController.js
│   │   │   ├── sucursalesController.js        ← V5
│   │   │   ├── usuariosController.js          ← V7 auditoría usuarios
│   │   │   └── ventasController.js            ← V7 caja automática
│   │   ├── middleware/auth.js
│   │   ├── routes/index.js                    ← V7 rutas auditoría
│   │   └── index.js
│   ├── .env                                   ← NO incluir al entregar
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── manifest.json                      ← V5 PWA
│   │   └── sw.js                              ← V5 Service Worker
│   ├── src/
│   │   ├── components/Layout.jsx              ← V7 ícono reporte + menú auditoría
│   │   ├── hooks/useAuth.jsx
│   │   ├── pages/
│   │   │   ├── Auditoria.jsx                  ← V7 nuevo
│   │   │   ├── Caja.jsx                       ← V5
│   │   │   ├── Clientes.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Descuentos.jsx                 ← V5
│   │   │   ├── Devoluciones.jsx
│   │   │   ├── Empresa.jsx
│   │   │   ├── Etiquetas.jsx                  ← V5
│   │   │   ├── General.jsx
│   │   │   ├── Inventario.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OrdenesCompra.jsx
│   │   │   ├── POS.jsx                        ← V6 botón email post-venta
│   │   │   ├── Productos.jsx                  ← V6 código automático
│   │   │   ├── ReportesAvanzados.jsx          ← V6+V7 Excel con labels claros
│   │   │   ├── Sucursales.jsx                 ← V5
│   │   │   ├── Usuarios.jsx
│   │   │   └── Ventas.jsx                     ← V7 WhatsApp con link factura
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── format.js
│   │   ├── App.jsx                            ← V7 ruta /auditoria
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── database_completo_v4.sql
├── database.sql
├── migration_v2.sql
├── migration_v3.sql
├── migration_v4.sql
├── migration_v5.sql
├── migration_v6.sql                           ← V7 tabla auditoria
├── start.bat
├── start.sh
└── README.md
```

## 🔐 Roles y permisos

| Sección | Admin | Cajero | Vendedor | Almacenista |
|---------|:-----:|:------:|:--------:|:-----------:|
| Dashboard | ✅ global | ✅ propio | ✅ | ✅ |
| Punto de Venta | ✅ | ✅ | ✅ | ❌ |
| Ventas | ✅ | ✅ | ✅ | ✅ |
| Caja | ✅ | ✅ | ❌ | ❌ |
| Devoluciones | ✅ | ✅ | ❌ | ❌ |
| Productos | ✅ | ❌ | ❌ | ✅ |
| Inventario | ✅ | ✅ | ✅ | ✅ |
| Órdenes de compra | ✅ | ❌ | ❌ | ✅ |
| Etiquetas | ✅ | ❌ | ❌ | ✅ |
| Clientes | ✅ | ✅ | ✅ | ✅ |
| Descuentos | ✅ | ❌ | ❌ | ❌ |
| Sucursales | ✅ | ❌ | ❌ | ❌ |
| Reportes avanzados | ✅ | ❌ | ❌ | ❌ |
| Mi empresa | ✅ | ❌ | ❌ | ❌ |
| Usuarios | ✅ | ❌ | ❌ | ❌ |
| **Auditoría** | ✅ | ❌ | ❌ | ❌ |

---

## 🗄️ Tablas de la base de datos

| Tabla | Descripción |
|-------|-------------|
| \`usuarios\` | Cuentas con roles |
| \`categorias\` | Categorías de productos |
| \`proveedores\` | Proveedores / distribuidores |
| \`productos\` | Catálogo con precios y stock |
| \`clientes\` | Clientes registrados |
| \`ventas\` | Cabecera de cada venta |
| \`venta_detalles\` | Ítems de cada venta |
| \`movimientos_inventario\` | Log de entradas/salidas |
| \`historial_precios\` | Cambios de precio por producto |
| \`codigos_barras\` | Códigos adicionales por producto |
| \`accesos_log\` | Login / logout / intentos fallidos |
| \`devoluciones\` | Cabecera de devoluciones |
| \`devolucion_detalles\` | Ítems devueltos |
| \`ordenes_compra\` | Órdenes a proveedores |
| \`orden_compra_detalles\` | Ítems de cada orden |
| \`empresa_config\` | Datos empresa para facturas |
| \`notificaciones\` | Alertas de stock y sistema |
| \`sucursales\` | Sucursales registradas *(V5)* |
| \`stock_sucursales\` | Stock por sucursal *(V5)* |
| \`descuentos\` | Códigos y reglas de descuento *(V5)* |
| \`caja_turnos\` | Turnos de caja con cuadre *(V5)* |
| \`caja_movimientos\` | Movimientos manuales de caja *(V5)* |
| \`auditoria\` | Log de acciones críticas del sistema *(V7)* |

---

## 📡 API Reference

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | \`/api/auth/login\` | Iniciar sesión |
| POST | \`/api/auth/logout\` | Cerrar sesión |
| GET | \`/api/auth/me\` | Usuario actual |

### Productos
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/productos\` | Listar todos |
| GET | \`/api/productos/stock-bajo\` | Stock bajo mínimo |
| GET | \`/api/productos/buscar-codigo?codigo=X\` | Buscar por código / barcode |
| GET | \`/api/productos/:id\` | Obtener uno |
| POST | \`/api/productos\` | Crear |
| PUT | \`/api/productos/:id\` | Actualizar |
| PATCH | \`/api/productos/:id/stock\` | Ajustar stock |
| GET | \`/api/productos/:id/precios\` | Historial de precios |

### Ventas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/ventas\` | Listar con filtros |
| GET | \`/api/ventas/:id\` | Detalle completo |
| POST | \`/api/ventas\` | Crear venta |
| GET | \`/api/ventas/:id/recibo\` | Datos del recibo |
| GET | \`/api/ventas/:id/factura\` | Factura HTML/PDF |
| POST | \`/api/ventas/:id/enviar-factura\` | Enviar factura por email *(V6)* |

### Devoluciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/devoluciones\` | Listar |
| GET | \`/api/devoluciones/:id\` | Detalle |
| POST | \`/api/devoluciones\` | Crear (restituye stock + registra en caja automáticamente) |

### Órdenes de compra
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/ordenes-compra\` | Listar |
| GET | \`/api/ordenes-compra/:id\` | Detalle |
| POST | \`/api/ordenes-compra\` | Crear |
| PUT | \`/api/ordenes-compra/:id\` | Editar borrador |
| PATCH | \`/api/ordenes-compra/:id/estado\` | Cambiar estado |

### Empresa y Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/empresa/config\` | Leer configuración |
| PUT | \`/api/empresa/config\` | Guardar configuración |
| GET | \`/api/notificaciones\` | Listar notificaciones |
| GET | \`/api/notificaciones/no-leidas\` | Conteo no leídas |
| PATCH | \`/api/notificaciones/:id/leer\` | Marcar una leída |
| PATCH | \`/api/notificaciones/leer-todas\` | Marcar todas leídas |
| POST | \`/api/notificaciones/verificar-stock\` | Generar alertas stock |

### Sucursales *(V5)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/sucursales\` | Listar sucursales |
| GET | \`/api/sucursales/:id\` | Detalle |
| POST | \`/api/sucursales\` | Crear |
| PUT | \`/api/sucursales/:id\` | Editar |
| GET | \`/api/sucursales/stock\` | Stock por sucursal |
| GET | \`/api/sucursales/consolidado\` | Vista consolidada admin |

### Descuentos *(V5)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/descuentos\` | Listar |
| GET | \`/api/descuentos/:id\` | Detalle |
| POST | \`/api/descuentos\` | Crear |
| PUT | \`/api/descuentos/:id\` | Editar |
| DELETE | \`/api/descuentos/:id\` | Eliminar |
| GET | \`/api/descuentos/buscar?codigo=X\` | Validar código en POS |

### Caja *(V5)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/caja/turno-activo\` | Turno abierto del usuario |
| GET | \`/api/caja/turnos\` | Historial de turnos (admin) |
| POST | \`/api/caja/abrir\` | Abrir turno |
| PATCH | \`/api/caja/turnos/:id/cerrar\` | Cerrar y cuadrar turno |
| GET | \`/api/caja/turnos/:id/resumen\` | Resumen del turno |
| GET | \`/api/caja/turnos/:turno_id/movimientos\` | Movimientos del turno |
| POST | \`/api/caja/turnos/:turno_id/movimientos\` | Registrar movimiento manual |

### Reportes avanzados *(V5)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/reportes-avanzados/datos\` | Todos los datos juntos |
| GET | \`/api/reportes-avanzados/rentabilidad\` | Rentabilidad por producto |
| GET | \`/api/reportes-avanzados/top10-mes\` | Top 10 más vendidos del mes |
| GET | \`/api/reportes-avanzados/comparativo\` | Comparativo últimos 6 meses |

### Auditoría *(V7)*
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | \`/api/auditoria\` | Últimos 200 registros (filtros: ?accion= &desde=) |
| GET | \`/api/auditoria/stats\` | Conteo por acción — últimos 30 días |

---

## 🔧 Solución de problemas

| Error | Causa | Solución |
|-------|-------|---------|
| \`Access denied for user 'root'\` | Contraseña MySQL incorrecta | Editar \`DB_PASSWORD\` en \`backend/.env\` |
| \`ECONNREFUSED\` | Backend caído | Arrancar el backend con \`npm run dev\` en la carpeta \`backend/\` |
| \`Credenciales incorrectas\` | Usuario no existe en BD | Ejecutar \`database_completo_v4.sql\` + \`migration_v5.sql\` |
| \`expiresIn should be a number\` | Falta \`JWT_EXPIRES\` en \`.env\` | Agregar \`JWT_EXPIRES=8h\` |
| \`Token requerido\` en factura | URL abierta sin sesión | Usar el botón 🧾 desde la app |
| Puerto 3001 ocupado | Otro proceso en ese puerto | Cambiar \`PORT\` en \`.env\` |
| \`Data too long for column 'imagen_url'\` | Campo VARCHAR muy corto para base64 | Ejecutar: \`ALTER TABLE productos MODIFY COLUMN imagen_url TEXT;\` |
| POS bloquea ventas | No hay turno de caja abierto | Abrir turno desde \`/caja\` antes de vender |
| \`Error enviando factura\` (email) | SMTP no configurado o credenciales incorrectas | Verificar \`SMTP_USER\` y \`SMTP_PASS\` en \`backend/.env\`. Para Gmail usar contraseña de aplicación |
| \`Cannot find module 'nodemailer'\` | Dependencia no instalada | Ejecutar \`npm install\` dentro de la carpeta \`backend/\` |
| \`Table 'inventario_pro.auditoria' doesn't exist\` | Migración V7 no ejecutada | Ejecutar \`migration_v6.sql\` en MySQL Workbench |

---

## 🔄 Migraciones

| Archivo | Descripción |
|---------|-------------|
| \`migration_v2.sql\` | Historial precios, log accesos |
| \`migration_v3.sql\` | Imágenes, escáner, temas |
| \`migration_v4.sql\` | Devoluciones, órdenes, empresa |
| \`migration_v5.sql\` | Sucursales, descuentos, caja, PWA |
| \`migration_v6.sql\` | Tabla de auditoría *(V7)* |

---

## 📁 .gitignore recomendado

\`\`\`gitignore
node_modules/
.env
.env.local
dist/
build/
.DS_Store
Thumbs.db
*.log
\`\`\`

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crear rama: \`git checkout -b feature/nueva-funcionalidad\`
3. Commit: \`git commit -m 'feat: descripción del cambio'\`
4. Push: \`git push origin feature/nueva-funcionalidad\`
5. Abrir Pull Request

**Convención de commits:**
\`\`\`
feat:     nueva funcionalidad
fix:      corrección de bug
docs:     documentación
refactor: refactorización sin cambio de funcionalidad
\`\`\`

---

## 📄 Licencia

MIT © 2024 — Inventario Pro

---

*Desarrollado con ❤️ usando React + Node.js + MySQL*
