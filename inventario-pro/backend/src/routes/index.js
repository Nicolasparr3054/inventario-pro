const router    = require('express').Router();
const auth      = require('../middleware/auth');
const authCtrl  = require('../controllers/authController');
const prodCtrl  = require('../controllers/productosController');
const ventaCtrl = require('../controllers/ventasController');
const dashCtrl  = require('../controllers/dashboardController');
const genCtrl   = require('../controllers/generalController');

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me',     auth, authCtrl.me);

// Dashboard
router.get('/dashboard', auth, dashCtrl.getStats);

// Productos
router.get('/productos',               auth, prodCtrl.getAll);
router.get('/productos/stock-bajo',    auth, prodCtrl.getLowStock);
router.get('/productos/:id',           auth, prodCtrl.getOne);
router.post('/productos',              auth, prodCtrl.create);
router.put('/productos/:id',           auth, prodCtrl.update);
router.patch('/productos/:id/stock',   auth, prodCtrl.ajustarStock);

// Ventas
router.get('/ventas',      auth, ventaCtrl.getAll);
router.get('/ventas/:id',  auth, ventaCtrl.getOne);
router.post('/ventas',     auth, ventaCtrl.create);

// Clientes
router.get('/clientes',       auth, genCtrl.clientesGetAll);
router.post('/clientes',      auth, genCtrl.clientesCreate);
router.put('/clientes/:id',   auth, genCtrl.clientesUpdate);

// Categorías
router.get('/categorias',    auth, genCtrl.categoriasGetAll);
router.post('/categorias',   auth, genCtrl.categoriasCreate);

// Proveedores
router.get('/proveedores',   auth, genCtrl.proveedoresGetAll);
router.post('/proveedores',  auth, genCtrl.proveedoresCreate);

module.exports = router;
