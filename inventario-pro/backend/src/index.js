require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { testConnection } = require('./config/database');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'Inventario Pro API', version: '5.0.0' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Inventario Pro API corriendo en http://localhost:${PORT}`);
    console.log(`📚 Docs: GET http://localhost:${PORT}/api`);
  });
});
