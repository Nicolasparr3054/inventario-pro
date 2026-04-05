const router    = require('express').Router();
const auth      = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const authCtrl  = require('../controllers/authController');
const prodCtrl  = require('../controllers/productosController');
const ventaCtrl = require('../controllers/ventasController');
const dashCtrl  = require('../controllers/dashboardController');
const genCtrl   = require('../controllers/generalController');
const repCtrl   = require('../controllers/reportesController');
const usrCtrl   = require('../controllers/usuariosController');
const devCtrl   = require('../controllers/devolucionesController');
const ocCtrl    = require('../controllers/ordenesCompraController');
const factCtrl  = require('../controllers/facturaController');

// ── Auth ─────────────────────────────────
router.post('/auth/login',  authCtrl.login);
router.post('/auth/logout', auth, authCtrl.logout);
router.get('/auth/me',      auth, authCtrl.me);

// ── Dashboard ────────────────────────────
router.get('/dashboard', auth, dashCtrl.getStats);

// ── Productos ────────────────────────────
router.get('/productos',               auth, prodCtrl.getAll);
router.get('/productos/stock-bajo',    auth, prodCtrl.getLowStock);
router.get('/productos/buscar-codigo', auth, prodCtrl.buscarPorCodigo);
router.get('/productos/:id',           auth, prodCtrl.getOne);
router.post('/productos',              auth, requireRole('admin','almacenista'), prodCtrl.create);
router.put('/productos/:id',           auth, requireRole('admin','almacenista'), prodCtrl.update);
router.patch('/productos/:id/stock',   auth, requireRole('admin','almacenista'), prodCtrl.ajustarStock);
router.get('/productos/:id/precios',   auth, requireRole('admin'), prodCtrl.getPriceHistory);

// ── Ventas ───────────────────────────────
router.get('/ventas',                auth, ventaCtrl.getAll);
router.get('/ventas/:id',            auth, ventaCtrl.getOne);
router.post('/ventas',               auth, ventaCtrl.create);
router.get('/ventas/:id/recibo',     auth, ventaCtrl.getRecibo);
router.get('/ventas/:id/factura',    factCtrl.facturaPDF);   // V4: Factura PDF (token por query param)

// ── V4: Devoluciones ─────────────────────
router.get('/devoluciones',      auth, requireRole('admin','cajero'), devCtrl.getAll);
router.get('/devoluciones/:id',  auth, requireRole('admin','cajero'), devCtrl.getOne);
router.post('/devoluciones',     auth, requireRole('admin','cajero'), devCtrl.create);

// ── V4: Órdenes de compra ─────────────────
router.get('/ordenes-compra',             auth, requireRole('admin','almacenista'), ocCtrl.getAll);
router.get('/ordenes-compra/:id',         auth, requireRole('admin','almacenista'), ocCtrl.getOne);
router.post('/ordenes-compra',            auth, requireRole('admin','almacenista'), ocCtrl.create);
router.put('/ordenes-compra/:id',         auth, requireRole('admin','almacenista'), ocCtrl.update);
router.patch('/ordenes-compra/:id/estado',auth, requireRole('admin','almacenista'), ocCtrl.cambiarEstado);

// ── V4: Empresa ──────────────────────────
router.get('/empresa/config',  auth, factCtrl.getConfig);
router.put('/empresa/config',  auth, requireRole('admin'), factCtrl.updateConfig);

// ── V4: Notificaciones ───────────────────
router.get('/notificaciones',              auth, factCtrl.getNotificaciones);
router.get('/notificaciones/no-leidas',    auth, factCtrl.getNoLeidas);
router.patch('/notificaciones/:id/leer',   auth, factCtrl.marcarLeida);
router.patch('/notificaciones/leer-todas', auth, factCtrl.marcarTodasLeidas);
router.post('/notificaciones/verificar-stock', auth, factCtrl.verificarStock);

// ── Clientes ─────────────────────────────
router.get('/clientes',       auth, genCtrl.clientesGetAll);
router.post('/clientes',      auth, genCtrl.clientesCreate);
router.put('/clientes/:id',   auth, genCtrl.clientesUpdate);

// ── Categorías ───────────────────────────
router.get('/categorias',    auth, genCtrl.categoriasGetAll);
router.post('/categorias',   auth, requireRole('admin'), genCtrl.categoriasCreate);

// ── Proveedores ──────────────────────────
router.get('/proveedores',   auth, genCtrl.proveedoresGetAll);
router.post('/proveedores',  auth, requireRole('admin'), genCtrl.proveedoresCreate);

// ── Reportes (solo admin) ────────────────
router.get('/reportes/ventas',     auth, requireRole('admin'), repCtrl.ventasPDF);
router.get('/reportes/stock',      auth, requireRole('admin'), repCtrl.stockPDF);
router.get('/reportes/ventas/csv', auth, requireRole('admin'), repCtrl.ventasCSV);

// ── Usuarios (solo admin) ────────────────
router.get('/usuarios',        auth, requireRole('admin'), usrCtrl.getAll);
router.post('/usuarios',       auth, requireRole('admin'), usrCtrl.create);
router.put('/usuarios/:id',    auth, requireRole('admin'), usrCtrl.update);
router.delete('/usuarios/:id', auth, requireRole('admin'), usrCtrl.remove);

// ── Accesos log (solo admin) ─────────────
router.get('/accesos', auth, requireRole('admin'), usrCtrl.getAccesos);

module.exports = router;
