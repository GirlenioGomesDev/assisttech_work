// Cria ou atualiza o usuario admin quando rodado manualmente.
require('dotenv').config();
const conectarDB = require('../config/db');
const ensureAdmin = require('../utils/ensureAdmin');

async function seedAdmin() {
  try {
    await conectarDB();
    const usuario = await ensureAdmin();
    console.log(`Usuario admin sincronizado: ${usuario.login}`);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao sincronizar usuario admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
