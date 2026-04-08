# 📦 Inventario Pro V5

Sistema de gestión de inventario y punto de venta construido con React + Node.js + MySQL.

## 🚀 Inicio rápido

### Windows
```bash
start.bat
```

### Linux / Mac
```bash
chmod +x start.sh && ./start.sh
```

### Manual
```bash
# Backend
cd backend && npm install && npm start

# Frontend (nueva terminal)
cd frontend && npm install && npm run dev
```

### Base de datos
- **Instalación limpia:** ejecuta `database_completo_v4.sql` luego `migration_v5.sql`
- **Desde V4:** ejecuta solo `migration_v5.sql`

**Credenciales por defecto:**
- Admin: `admin@inventariopro.com` / `password`
- Cajero: `cajero@inventariopro.com` / `password`

---

## 🔧 Variables de entorno (`backend/.env`)

Crea el archivo `backend/.env` con los siguientes valores y ajusta según tu configuración:

```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA_MYSQL
DB_NAME=inventario_pro
JWT_SECRET=cambia_esto_por_una_clave_segura
JWT_EXPIRES=8h
```

> ⚠️ **Importante:** Nunca compartas este archivo públicamente. Cada instalación debe tener su propia contraseña y JWT_SECRET.

---

## 🐛 Problemas conocidos y soluciones

### Error: "Data too long for column 'imagen_url'"
**Síntoma:** Al subir una imagen de producto, aparece error de MySQL sobre cadena demasiado larga.

**Causa:** Las imágenes se convierten a base64 y se almacenan en `imagen_url`, pero el campo es VARCHAR limitado.

**Solución:** Ejecuta esta consulta SQL para cambiar el tipo de columna:
```sql
ALTER TABLE productos MODIFY COLUMN imagen_url TEXT;
```
O actualiza tu esquema de base de datos cambiando `imagen_url VARCHAR(1000)` por `imagen_url TEXT`.

---

## ✨ Features V5

### 1. 🏪 Multi-Sucursal
- Gestión de múltiples sucursales con nombre, dirección y teléfono
- Stock independiente por sucursal (`stock_sucursales`)
- Cada venta queda asociada a una sucursal
- El **admin** ve stock consolidado de todas las sucursales
- Los **cajeros/vendedores** operan en su sucursal asignada
- Selector de sucursal activa en el topbar (admin)
- Vista consolidada de inventario por sucursal
- Ruta: `/sucursales` (solo admin)

### 2. 📱 App Móvil PWA
- `manifest.json` y service worker para instalación como app nativa
- Diseño completamente responsive desde 320px
- Escáner de código de barras usando la **cámara del celular** (html5-qrcode)
- Botón "📲 Instalar app" en el topbar (aparece automáticamente en móvil)
- Menú hamburguesa en móvil para sidebar
- Modo offline básico con caché del service worker

### 3. 📊 Reportes Avanzados Exportables
- **Rentabilidad por producto:** precio compra vs venta vs unidades vendidas + margen %
- **Top 10 del mes:** los más vendidos con barras visuales comparativas
- **Comparativo mensual:** últimos 6 meses con variación vs mes anterior
- Cada reporte exporta a **PDF imprimible** (HTML con `window.print()`)
- Dashboard visual con KPIs, gráficas de barras inline
- Ruta: `/reportes-avanzados` (solo admin)

### 4. 🏷️ Descuentos y Promociones
- Tabla `descuentos` con código único, tipo (porcentaje / monto fijo)
- Aplica a: todos, categoría, producto o cliente específico
- Fechas de vigencia y límite de usos
- En el **POS**: campo para buscar y aplicar descuento por código
- También acepta descuento manual en monto
- Se registra el código de descuento usado en cada venta
- CRUD completo desde `/descuentos` (solo admin)

### 5. 🏧 Control de Caja / Turnos
- **Apertura de turno** con monto inicial en efectivo
- **Movimientos manuales:** ingresos y egresos extra
- **Cierre con cuadre:** compara efectivo contado vs esperado, muestra diferencia
- Las ventas y devoluciones se registran automáticamente como movimientos
- El **POS** bloquea ventas si el cajero no tiene turno abierto
- El **admin** puede ver todos los turnos e historial de cuadres
- Ruta: `/caja` (admin y cajero)

### 6. 🖨️ Generador de Etiquetas
- Usa **JsBarcode** (CDN gratuito) para generar códigos de barras reales (CODE128)
- En lista de productos: botón "Imprimir etiqueta" por producto
- Página `/etiquetas`: selección múltiple con cantidad personalizada por producto
- Preview de la etiqueta: código de barras + nombre + precio + empresa
- Impresión directa con `window.print()`, sin dependencias de servidor
- Ruta: `/etiquetas` (admin y almacenista)

---

## 🗂️ Estructura del proyecto

```
inventario-pro/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── cajaController.js          ← V5
│   │   │   ├── dashboardController.js
│   │   │   ├── descuentosController.js    ← V5
│   │   │   ├── devolucionesController.js
│   │   │   ├── etiquetasController.js     ← V5
│   │   │   ├── facturaController.js
│   │   │   ├── generalController.js
│   │   │   ├── ordenesCompraController.js
│   │   │   ├── productosController.js
│   │   │   ├── reportesAvanzadosController.js ← V5
│   │   │   ├── reportesController.js
│   │   │   ├── sucursalesController.js    ← V5
│   │   │   ├── usuariosController.js
│   │   │   └── ventasController.js
│   │   ├── middleware/auth.js
│   │   ├── routes/index.js
│   │   └── index.js
│   ├── .env                               ← NO incluir al entregar
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json                  ← V5 PWA
│   │   └── sw.js                          ← V5 Service Worker
│   ├── src/
│   │   ├── components/Layout.jsx
│   │   ├── hooks/useAuth.jsx
│   │   ├── pages/
│   │   │   ├── Caja.jsx                   ← V5
│   │   │   ├── Clientes.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Descuentos.jsx             ← V5
│   │   │   ├── Devoluciones.jsx
│   │   │   ├── Empresa.jsx
│   │   │   ├── Etiquetas.jsx              ← V5
│   │   │   ├── General.jsx
│   │   │   ├── Inventario.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OrdenesCompra.jsx
│   │   │   ├── POS.jsx
│   │   │   ├── Productos.jsx
│   │   │   ├── ReportesAvanzados.jsx      ← V5
│   │   │   ├── Sucursales.jsx             ← V5
│   │   │   ├── Usuarios.jsx
│   │   │   └── Ventas.jsx
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── format.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── database_completo_v4.sql
├── migration_v5.sql
├── start.bat
├── start.sh
└── README.md
```

---

## 👥 Roles y permisos

| Feature            | Admin | Cajero | Vendedor | Almacenista |
|--------------------|:-----:|:------:|:--------:|:-----------:|
| Dashboard          | ✅    | ✅     | ✅       | ✅          |
| POS                | ✅    | ✅     | ✅       | ❌          |
| Ventas             | ✅    | ✅     | ✅       | ✅          |
| Caja               | ✅    | ✅     | ❌       | ❌          |
| Devoluciones       | ✅    | ✅     | ❌       | ❌          |
| Productos          | ✅    | ❌     | ❌       | ✅          |
| Inventario         | ✅    | ✅     | ✅       | ✅          |
| Órdenes compra     | ✅    | ❌     | ❌       | ✅          |
| Etiquetas          | ✅    | ❌     | ❌       | ✅          |
| Clientes           | ✅    | ✅     | ✅       | ✅          |
| Descuentos         | ✅    | ❌     | ❌       | ❌          |
| Sucursales         | ✅    | ❌     | ❌       | ❌          |
| Reportes avanzados | ✅    | ❌     | ❌       | ❌          |
| Usuarios           | ✅    | ❌     | ❌       | ❌          |
| Mi empresa         | ✅    | ❌     | ❌       | ❌          |

---

## 📝 Notas técnicas

- **Sin Tailwind** — CSS custom con variables CSS (`--bg-card`, `--accent`, etc.)
- **JWT_EXPIRES=8h** — Sesiones de 8 horas
- **html5-qrcode** — Escáner de cámara (CDN, gratuito)
- **JsBarcode** — Generación de códigos de barras (CDN, gratuito)
- **PWA** — Instalable en móvil/desktop sin App Store
- **Responsive** — Funciona desde 320px de ancho

---

## 🔄 Migraciones

| Archivo              | Descripción                        |
|----------------------|------------------------------------|
| `migration_v2.sql`   | Historial precios, log accesos     |
| `migration_v3.sql`   | Imágenes, escáner, temas           |
| `migration_v4.sql`   | Devoluciones, órdenes, empresa     |
| `migration_v5.sql`   | Sucursales, descuentos, caja, PWA  |