require('dotenv').config();
const app = require('../src/app');
const conectarDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await conectarDB();
    return app(req, res);
  } catch (error) {
    console.error('Erro ao inicializar API:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
