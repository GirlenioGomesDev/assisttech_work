const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const gerarCodigo = require('../utils/gerarCodigo');

const PERFIS_VALIDOS = ['admin', 'atendente', 'tecnico', 'financeiro'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizarPerfis = (body = {}) => {
  const perfis = Array.isArray(body.perfis) ? body.perfis : [body.perfil || 'tecnico'];
  const perfisValidos = [...new Set(perfis.filter((perfil) => PERFIS_VALIDOS.includes(perfil)))];
  return perfisValidos.length ? perfisValidos : ['tecnico'];
};

const validarUsuario = (body = {}, { criando = false } = {}) => {
  const erros = [];
  if (criando && !body.senha) erros.push('senha');
  if (!body.nome || String(body.nome).trim().length < 2) erros.push('nome');
  if (!body.email || !EMAIL_RE.test(String(body.email))) erros.push('email');
  if (!body.login || String(body.login).trim().length < 3) erros.push('login');
  if (body.senha && String(body.senha).length < 6) erros.push('senha_minima');
  return erros;
};

const montarDadosUsuario = (body = {}, perfis) => ({
  nome: String(body.nome || '').trim(),
  email: String(body.email || '').trim().toLowerCase(),
  login: String(body.login || '').trim(),
  perfil: perfis[0],
  perfis,
  ativo: body.ativo !== undefined ? Boolean(body.ativo) : true,
});

exports.criarUsuario = async (req, res) => {
  try {
    const erros = validarUsuario(req.body, { criando: true });
    if (erros.length) return res.status(400).json({ erro: 'Dados de usuario invalidos', campos: erros });

    const total = await Usuario.countDocuments();
    const senha_hash = await bcrypt.hash(req.body.senha, 10);
    const perfis = normalizarPerfis(req.body);
    const usuario = new Usuario({
      ...montarDadosUsuario(req.body, perfis),
      id_usuario: gerarCodigo('USR', total + 1),
      senha_hash,
    });

    await usuario.save();
    const obj = usuario.toObject();
    delete obj.senha_hash;
    res.status(201).json(obj);
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({ erro: status === 409 ? 'E-mail ou login ja cadastrado' : error.message });
  }
};

exports.listarUsuarios = async (_req, res) => {
  try {
    res.json(await Usuario.find().select('-senha_hash').sort({ nome: 1 }).lean());
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.atualizarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuario nao encontrado' });

    const body = {
      nome: req.body.nome ?? usuario.nome,
      email: req.body.email ?? usuario.email,
      login: req.body.login ?? usuario.login,
      perfil: req.body.perfil ?? usuario.perfil,
      perfis: req.body.perfis ?? usuario.perfis,
      senha: req.body.senha,
      ativo: req.body.ativo ?? usuario.ativo,
    };
    const erros = validarUsuario(body);
    if (erros.length) return res.status(400).json({ erro: 'Dados de usuario invalidos', campos: erros });

    const perfisAtuais = usuario.perfis?.length ? usuario.perfis : [usuario.perfil];
    const perfis = normalizarPerfis(body);

    if (perfisAtuais.includes('admin') && !perfis.includes('admin')) {
      const totalAdmins = await Usuario.countDocuments({
        _id: { $ne: usuario._id },
        ativo: true,
        $or: [{ perfil: 'admin' }, { perfis: 'admin' }],
      });

      if (totalAdmins === 0) {
        return res.status(400).json({ erro: 'Mantenha pelo menos um administrador ativo' });
      }
    }

    Object.assign(usuario, montarDadosUsuario(body, perfis));

    if (body.senha) {
      usuario.senha_hash = await bcrypt.hash(body.senha, 10);
    }

    await usuario.save();
    const obj = usuario.toObject();
    delete obj.senha_hash;
    res.json(obj);
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({ erro: status === 409 ? 'E-mail ou login ja cadastrado' : error.message });
  }
};

exports.deletarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuario nao encontrado' });
    if (String(usuario._id) === String(req.usuario?.id)) {
      return res.status(400).json({ erro: 'Nao e possivel apagar o usuario logado' });
    }

    const perfis = usuario.perfis?.length ? usuario.perfis : [usuario.perfil];

    if (perfis.includes('admin')) {
      const totalAdmins = await Usuario.countDocuments({
        _id: { $ne: usuario._id },
        ativo: true,
        $or: [{ perfil: 'admin' }, { perfis: 'admin' }],
      });

      if (totalAdmins === 0) {
        return res.status(400).json({ erro: 'Nao e possivel apagar o ultimo administrador ativo' });
      }
    }

    usuario.ativo = false;
    await usuario.save();
    res.json({ mensagem: 'Usuario desativado com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.listarTecnicos = async (_req, res) => {
  try {
    res.json(
      await Usuario.find({ ativo: true, $or: [{ perfil: 'tecnico' }, { perfis: 'tecnico' }] })
        .select('-senha_hash')
        .sort({ nome: 1 })
        .lean()
    );
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
