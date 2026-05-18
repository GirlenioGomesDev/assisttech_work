const Usuario = require('../models/Usuario');
const LoginLog = require('../models/LoginLog');
const SessaoUsuario = require('../models/SessaoUsuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const getIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  return (Array.isArray(forwarded) ? forwarded[0] : String(forwarded || req.ip || req.socket?.remoteAddress || '')).split(',')[0].trim();
};

const registrarLogin = async (req, { login, sucesso, motivo, usuario }) => {
  try {
    const perfis = usuario ? (Array.isArray(usuario.perfis) && usuario.perfis.length ? usuario.perfis : [usuario.perfil]) : [];
    await LoginLog.create({
      login: String(login || '').trim().toLowerCase(),
      sucesso,
      motivo,
      usuario: usuario ? {
        id: String(usuario._id),
        nome: usuario.nome,
        perfis,
      } : undefined,
      ip: getIp(req),
      user_agent: req.headers['user-agent'],
    });
  } catch (error) {
    console.error('Erro ao registrar login:', error.message);
  }
};

const parseExpiresInToDate = (expiresIn = '8h') => {
  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const ms = match ? Number(match[1]) * multipliers[match[2]] : 8 * 3_600_000;
  return new Date(Date.now() + ms);
};

exports.login = async (req, res) => {
  try {
    const { login, senha } = req.body || {};

    if (!login || !senha) {
      return res.status(400).json({ erro: 'Login e senha sao obrigatorios' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ erro: 'JWT_SECRET nao configurado' });
    }

    const loginNormalizado = String(login).trim();
    const usuario = await Usuario.findOne({ login: loginNormalizado, ativo: true });
    if (!usuario) {
      await registrarLogin(req, { login: loginNormalizado, sucesso: false, motivo: 'usuario_nao_encontrado' });
      return res.status(401).json({ erro: 'Usuario ou senha invalidos' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      await registrarLogin(req, { login: loginNormalizado, sucesso: false, motivo: 'senha_invalida', usuario });
      return res.status(401).json({ erro: 'Usuario ou senha invalidos' });
    }

    const perfis = Array.isArray(usuario.perfis) && usuario.perfis.length ? usuario.perfis : [usuario.perfil];
    const expiresIn = process.env.JWT_EXPIRES_IN || '8h';
    const idSessao = crypto.randomUUID();
    const expiraEm = parseExpiresInToDate(expiresIn);
    const token = jwt.sign(
      { id: usuario._id, id_usuario: usuario.id_usuario, nome: usuario.nome, perfil: perfis[0], perfis, sid: idSessao },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    await SessaoUsuario.create({
      id_sessao: idSessao,
      usuario: {
        id: String(usuario._id),
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        perfis,
      },
      ip: getIp(req),
      user_agent: req.headers['user-agent'],
      expira_em: expiraEm,
    });
    await registrarLogin(req, { login: loginNormalizado, sucesso: true, motivo: 'login_ok', usuario });

    res.json({
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        perfil: perfis[0],
        perfis,
      },
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.usuario?.sid) {
      await SessaoUsuario.findOneAndUpdate(
        { id_sessao: req.usuario.sid, status: 'ativa' },
        { status: 'encerrada', encerrada_em: new Date() }
      );
    }
    res.json({ mensagem: 'Sessao encerrada com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
