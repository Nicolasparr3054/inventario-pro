const { pool } = require('../config/database');
const { registrar } = require('./auditoriaController');

exports.getAll = async (req, res) => {
  try {
    const { search = '', categoria_id, activo = 1 } = req.query;
    let q = `SELECT p.*, c.nombre AS categoria_nombre, c.color AS categoria_color,
                    pr.nombre AS proveedor_nombre
             FROM productos p
             LEFT JOIN categorias c   ON p.categoria_id  = c.id
             LEFT JOIN proveedores pr ON p.proveedor_id  = pr.id
             WHERE p.activo = ?`;
    const params = [activo];
    if (search) { q += ' AND (p.nombre LIKE ? OR p.codigo LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (categoria_id) { q += ' AND p.categoria_id = ?'; params.push(categoria_id); }
    q += ' ORDER BY p.nombre';
    const [rows] = await pool.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre, pr.nombre AS proveedor_nombre
       FROM productos p
       LEFT JOIN categorias c   ON p.categoria_id  = c.id
       LEFT JOIN proveedores pr ON p.proveedor_id  = pr.id
       WHERE p.id = ?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// V3: buscar por código de barras o código de producto
exports.buscarPorCodigo = async (req, res) => {
  const { codigo } = req.query;
  if (!codigo) return res.status(400).json({ error: 'Código requerido' });
  try {
    // Buscar primero por código directo del producto
    let [rows] = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre, c.color AS categoria_color
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.codigo = ? AND p.activo = 1`, [codigo]
    );
    // Si no encuentra, buscar en codigos_barras
    if (!rows.length) {
      [rows] = await pool.query(
        `SELECT p.*, c.nombre AS categoria_nombre, c.color AS categoria_color
         FROM codigos_barras cb
         JOIN productos p ON cb.producto_id = p.id
         LEFT JOIN categorias c ON p.categoria_id = c.id
         WHERE cb.codigo = ? AND p.activo = 1`, [codigo]
      );
    }
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const { codigo, nombre, descripcion, categoria_id, proveedor_id,
          precio_compra, precio_venta, stock, stock_minimo, imagen_url } = req.body;
  if (!codigo || !nombre) return res.status(400).json({ error: 'Código y nombre requeridos' });
  try {
    const [r] = await pool.query(
      `INSERT INTO productos (codigo,nombre,descripcion,categoria_id,proveedor_id,
         precio_compra,precio_venta,stock,stock_minimo,imagen_url)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [codigo, nombre, descripcion, categoria_id||null, proveedor_id||null,
       precio_compra||0, precio_venta||0, stock||0, stock_minimo||5, imagen_url||null]
    );
    if (stock > 0) {
      await pool.query(
        `INSERT INTO movimientos_inventario (producto_id,tipo,cantidad,stock_anterior,stock_nuevo,motivo)
         VALUES (?,?,?,?,?,?)`,
        [r.insertId, 'entrada', stock||0, 0, stock||0, 'Stock inicial']
      );
    }
    res.status(201).json({ id: r.insertId, message: 'Producto creado' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Código duplicado' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { nombre, descripcion, categoria_id, proveedor_id,
          precio_compra, precio_venta, stock_minimo, imagen_url, activo } = req.body;
  const id = req.params.id;
  try {
    const [[actual]] = await pool.query('SELECT precio_compra, precio_venta FROM productos WHERE id=?', [id]);
    if (actual) {
      const cambioCompra = Number(precio_compra) !== Number(actual.precio_compra);
      const cambioVenta  = Number(precio_venta)  !== Number(actual.precio_venta);
      if (cambioCompra || cambioVenta) {
        await pool.query(
          `INSERT INTO historial_precios
            (producto_id, precio_compra_anterior, precio_venta_anterior, precio_compra_nuevo, precio_venta_nuevo, usuario_id)
           VALUES (?,?,?,?,?,?)`,
          [id, actual.precio_compra, actual.precio_venta, precio_compra, precio_venta, req.user?.id || null]
        );
        // V7: Auditoría de cambio de precio
        await registrar(pool, req.user, 'cambiar_precio', 'productos', id,
          `Precio compra: ${actual.precio_compra} → ${precio_compra} | Precio venta: ${actual.precio_venta} → ${precio_venta}`,
          req.ip);
      }
    }
    await pool.query(
      `UPDATE productos SET nombre=?,descripcion=?,categoria_id=?,proveedor_id=?,
         precio_compra=?,precio_venta=?,stock_minimo=?,imagen_url=?,activo=?
       WHERE id=?`,
      [nombre, descripcion, categoria_id||null, proveedor_id||null,
       precio_compra, precio_venta, stock_minimo, imagen_url||null, activo ?? 1, id]
    );
    res.json({ message: 'Producto actualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.ajustarStock = async (req, res) => {
  const { cantidad, motivo } = req.body;
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT stock FROM productos WHERE id=?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    const stockAnt   = rows[0].stock;
    const stockNuevo = stockAnt + parseInt(cantidad);
    if (stockNuevo < 0) return res.status(400).json({ error: 'Stock no puede ser negativo' });
    await pool.query('UPDATE productos SET stock=? WHERE id=?', [stockNuevo, id]);
    await pool.query(
      `INSERT INTO movimientos_inventario (producto_id,tipo,cantidad,stock_anterior,stock_nuevo,motivo)
       VALUES (?,?,?,?,?,?)`,
      [id, cantidad>0?'entrada':'salida', Math.abs(cantidad), stockAnt, stockNuevo, motivo||'Ajuste manual']
    );
    res.json({ message: 'Stock ajustado', stock_nuevo: stockNuevo });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getLowStock = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
       FROM productos p LEFT JOIN categorias c ON p.categoria_id=c.id
       WHERE p.stock <= p.stock_minimo AND p.activo=1
       ORDER BY (p.stock - p.stock_minimo) ASC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPriceHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.*, u.nombre AS usuario_nombre
       FROM historial_precios h
       LEFT JOIN usuarios u ON h.usuario_id = u.id
       WHERE h.producto_id = ?
       ORDER BY h.creado_en DESC LIMIT 50`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};