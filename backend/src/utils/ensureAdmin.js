const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const gerarCodigo = require('./gerarCodigo');

async function gerarCodigoUsuarioLivre() {
  const usuarios = await Usuario.find({ id_usuario: /^USR-\d+$/ }).select('id_usuario').lean();
  const usados = new Set(usuarios.map((usuario) => usuario.id_usuario));
  const maior = usuarios.reduce((max, usuario) => {
    const numero = Number(String(usuario.id_usuario).replace('USR-', ''));
    return Number.isFinite(numero) && numero > max ? numero : max;
  }, 0);

  let proximo = maior + 1;
  let codigo = gerarCodigo('USR', proximo);
  while (usados.has(codigo)) {
    proximo += 1;
    codigo = gerarCodigo('USR', proximo);
  }
  return codigo;
}

async function ensureAdmin() {
  const {
    ADMIN_NOME = 'Administrador',
    ADMIN_EMAIL = 'admin@assisttech.com',
    ADMIN_LOGIN = 'admin',
    ADMIN_SENHA = 'admin123',
  } = process.env;

  const senha_hash = await bcrypt.hash(ADMIN_SENHA, 10);
  const existente = await Usuario.findOne({
    $or: [{ email: ADMIN_EMAIL }, { login: ADMIN_LOGIN }],
  });

  if (existente) {
    existente.nome = existente.nome || ADMIN_NOME;
    existente.email = existente.email || ADMIN_EMAIL;
    existente.login = existente.login || ADMIN_LOGIN;
    existente.perfil = 'admin';
    existente.perfis = ['admin'];
    existente.ativo = true;
    existente.senha_hash = senha_hash;
    await existente.save();
    return existente;
  }

  return Usuario.create({
    id_usuario: await gerarCodigoUsuarioLivre(),
    nome: ADMIN_NOME,
    email: ADMIN_EMAIL,
    login: ADMIN_LOGIN,
    perfil: 'admin',
    perfis: ['admin'],
    ativo: true,
    senha_hash,
  });
}

module.exports = ensureAdmin;
