// Ponto de entrada: conecta no banco, garante admin e inicia o servidor.
require('dotenv').config();
const app = require('./app');
const conectarDB = require('./config/db');
const ensureAdmin = require('./utils/ensureAdmin');
const PORT = process.env.PORT || 3000;

(async () => {
  // A API so sobe depois que o Mongo estiver pronto.
  await conectarDB();
  // Cria ou atualiza o usuario admin inicial.
  await ensureAdmin();
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
})();
