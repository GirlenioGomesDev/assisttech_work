require('dotenv').config();
const bcrypt = require('bcryptjs');
const conectarDB = require('../config/db');
const Usuario = require('../models/Usuario');
const gerarCodigo = require('../utils/gerarCodigo');

async function seedAdmin() {
  try {
    const { ADMIN_NOME, ADMIN_EMAIL, ADMIN_LOGIN, ADMIN_SENHA } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_LOGIN || !ADMIN_SENHA) {
      console.log('Defina ADMIN_EMAIL, ADMIN_LOGIN e ADMIN_SENHA no .env para criar o usuário admin');
      process.exit(1);
    }

    await conectarDB();

    const existente = await Usuario.findOne({
      $or: [{ email: ADMIN_EMAIL }, { login: ADMIN_LOGIN }],
    });

    if (existente) {
      console.log('Usuário admin já existe.');
      process.exit(0);
    }

    const total = await Usuario.countDocuments();
    const senha_hash = await bcrypt.hash(ADMIN_SENHA, 10);

    await Usuario.create({
      id_usuario: gerarCodigo('USR', total + 1),
      nome: ADMIN_NOME || 'Administrador',
      email: ADMIN_EMAIL,
      login: ADMIN_LOGIN,
      perfil: 'admin',
      ativo: true,
      senha_hash,
    });

    console.log('Usuário admin criado com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error.message);
    process.exit(1);
  }
}

seedAdmin();
