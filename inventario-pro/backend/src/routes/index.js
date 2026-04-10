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
const sucCtrl   = require('../controllers/sucursalesController');
const repAvCtrl = require('../controllers/reportesAvanzadosController');
const descCtrl  = require('../controllers/descuentosController');
const cajaCtrl  = require('../controllers/cajaController');
const etiCtrl   = require('../controllers/etiquetasController');
const auditoriaCtrl = require('../controllers/auditoriaController');
router.post('/auth/login',  authCtrl.login);
router.post('/auth/logout', auth, authCtrl.logout);
router.get('/auth/me',      auth, authCtrl.me);

router.get('/dashboard', auth, dashCtrl.getStats);

router.get('/productos',               auth, prodCtrl.getAll);
router.get('/productos/stock-bajo',    auth, prodCtrl.getLowStock);
router.get('/productos/buscar-codigo', auth, prodCtrl.buscarPorCodigo);
router.get('/productos/:id',           auth, prodCtrl.getOne);
router.post('/productos',              auth, requireRole('admin','almacenista'), prodCtrl.create);
router.put('/productos/:id',           auth, requireRole('admin','almacenista'), prodCtrl.update);
router.patch('/productos/:id/stock',   auth, requireRole('admin','almacenista'), prodCtrl.ajustarStock);
router.get('/productos/:id/precios',   auth, requireRole('admin'), prodCtrl.getPriceHistory);

router.get('/ventas',                auth, ventaCtrl.getAll);
router.get('/ventas/:id',            auth, ventaCtrl.getOne);
router.post('/ventas',               auth, ventaCtrl.create);
router.get('/ventas/:id/recibo',     auth, ventaCtrl.getRecibo);
router.get('/ventas/:id/factura',    factCtrl.facturaPDF);
router.post('/ventas/:id/enviar-factura', auth, factCtrl.enviarFacturaPorEmail);

router.get('/devoluciones',      auth, requireRole('admin','cajero'), devCtrl.getAll);
router.get('/devoluciones/:id',  auth, requireRole('admin','cajero'), devCtrl.getOne);
router.post('/devoluciones',     auth, requireRole('admin','cajero'), devCtrl.create);

router.get('/ordenes-compra',             auth, requireRole('admin','almacenista'), ocCtrl.getAll);
router.get('/ordenes-compra/:id',         auth, requireRole('admin','almacenista'), ocCtrl.getOne);
router.post('/ordenes-compra',            auth, requireRole('admin','almacenista'), ocCtrl.create);
router.put('/ordenes-compra/:id',         auth, requireRole('admin','almacenista'), ocCtrl.update);
router.patch('/ordenes-compra/:id/estado',auth, requireRole('admin','almacenista'), ocCtrl.cambiarEstado);

router.get('/empresa/config',  auth, factCtrl.getConfig);
router.put('/empresa/config',  auth, requireRole('admin'), factCtrl.updateConfig);

router.get('/notificaciones',              auth, factCtrl.getNotificaciones);
router.get('/notificaciones/no-leidas',    auth, factCtrl.getNoLeidas);
router.patch('/notificaciones/:id/leer',   auth, factCtrl.marcarLeida);
router.patch('/notificaciones/leer-todas', auth, factCtrl.marcarTodasLeidas);
router.post('/notificaciones/verificar-stock', auth, factCtrl.verificarStock);

router.get('/clientes',       auth, genCtrl.clientesGetAll);
router.post('/clientes',      auth, genCtrl.clientesCreate);
router.put('/clientes/:id',   auth, genCtrl.clientesUpdate);

router.get('/categorias',    auth, genCtrl.categoriasGetAll);
router.post('/categorias',   auth, requireRole('admin'), genCtrl.categoriasCreate);

router.get('/proveedores',   auth, genCtrl.proveedoresGetAll);
router.post('/proveedores',  auth, requireRole('admin'), genCtrl.proveedoresCreate);

router.get('/reportes/ventas',     auth, requireRole('admin'), repCtrl.ventasPDF);
router.get('/reportes/stock',      auth, requireRole('admin'), repCtrl.stockPDF);
router.get('/reportes/ventas/csv', auth, requireRole('admin'), repCtrl.ventasCSV);

router.get('/usuarios',        auth, requireRole('admin'), usrCtrl.getAll);
router.post('/usuarios',       auth, requireRole('admin'), usrCtrl.create);
router.put('/usuarios/:id',    auth, requireRole('admin'), usrCtrl.update);
router.delete('/usuarios/:id', auth, requireRole('admin'), usrCtrl.remove);

router.get('/accesos', auth, requireRole('admin'), usrCtrl.getAccesos);

router.get('/auditoria', auth, requireRole('admin'), auditoriaCtrl.getAll);
router.get('/auditoria/stats', auth, requireRole('admin'), auditoriaCtrl.getStats);

// ── V5: Sucursales ────────────────────────────────────────────
router.get('/sucursales',                auth, sucCtrl.getAll);
router.get('/sucursales/stock',          auth, sucCtrl.getStock);
router.get('/sucursales/consolidado',    auth, requireRole('admin'), sucCtrl.getConsolidado);
router.get('/sucursales/:id',            auth, sucCtrl.getOne);
router.post('/sucursales',               auth, requireRole('admin'), sucCtrl.create);
router.put('/sucursales/:id',            auth, requireRole('admin'), sucCtrl.update);
router.post('/sucursales/ajustar-stock', auth, requireRole('admin','almacenista'), sucCtrl.ajustarStock);

// ── V5: Reportes Avanzados ────────────────────────────────────
router.get('/reportes-avanzados/datos',        auth, requireRole('admin'), repAvCtrl.getDatos);
router.get('/reportes-avanzados/rentabilidad', auth, requireRole('admin'), repAvCtrl.rentabilidad);
router.get('/reportes-avanzados/top10-mes',    auth, requireRole('admin'), repAvCtrl.top10Mes);
router.get('/reportes-avanzados/comparativo',  auth, requireRole('admin'), repAvCtrl.comparativoMensual);

// ── V5: Descuentos ────────────────────────────────────────────
router.get('/descuentos',         auth, requireRole('admin'), descCtrl.getAll);
router.get('/descuentos/buscar',  auth, descCtrl.buscarPorCodigo);
router.get('/descuentos/:id',     auth, requireRole('admin'), descCtrl.getOne);
router.post('/descuentos',        auth, requireRole('admin'), descCtrl.create);
router.put('/descuentos/:id',     auth, requireRole('admin'), descCtrl.update);
router.delete('/descuentos/:id',  auth, requireRole('admin'), descCtrl.remove);

// ── V5: Caja / Turnos ─────────────────────────────────────────
router.get('/caja/turnos',                       auth, requireRole('admin','cajero'), cajaCtrl.getTurnos);
router.get('/caja/turno-activo',                 auth, cajaCtrl.getTurnoActivo);
router.post('/caja/abrir',                       auth, requireRole('admin','cajero'), cajaCtrl.abrirTurno);
router.patch('/caja/turnos/:id/cerrar',          auth, requireRole('admin','cajero'), cajaCtrl.cerrarTurno);
router.get('/caja/turnos/:id/resumen',           auth, requireRole('admin','cajero'), cajaCtrl.getResumenTurno);
router.get('/caja/turnos/:turno_id/movimientos', auth, requireRole('admin','cajero'), cajaCtrl.getMovimientos);
router.post('/caja/turnos/:turno_id/movimientos',auth, requireRole('admin','cajero'), cajaCtrl.addMovimiento);

// ── V5: Etiquetas ─────────────────────────────────────────────
router.get('/etiquetas/productos',   auth, requireRole('admin','almacenista'), etiCtrl.getProductos);
router.post('/etiquetas/generar',    auth, requireRole('admin','almacenista'), etiCtrl.generarHTML);

module.exports = router;
