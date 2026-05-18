require('dotenv').config();
const app = require('./app');
const conectarDB = require('./config/db');
const ensureAdmin = require('./utils/ensureAdmin');
const PORT = process.env.PORT || 3000;

(async () => {
  await conectarDB();
  await ensureAdmin();
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
})();
