const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const gerarCodigo = require('../utils/gerarCodigo');

const PERFIS_VALIDOS = ['admin', 'atendente', 'tecnico', 'financeiro'];

const normalizarPerfis = (body = {}) => {
  const perfis = Array.isArray(body.perfis) ? body.perfis : [body.perfil || 'tecnico'];
  const perfisValidos = [...new Set(perfis.filter((perfil) => PERFIS_VALIDOS.includes(perfil)))];
  return perfisValidos.length ? perfisValidos : ['tecnico'];
};

exports.criarUsuario = async (req, res) => {
  try {
    const total = await Usuario.countDocuments();
    const senha_hash = await bcrypt.hash(req.body.senha, 10);
    const perfis = normalizarPerfis(req.body);
    const usuario = new Usuario({
      ...req.body,
      perfil: perfis[0],
      perfis,
      id_usuario: gerarCodigo('USR', total + 1),
      senha_hash,
    });
    await usuario.save();
    const obj = usuario.toObject();
    delete obj.senha_hash;
    res.status(201).json(obj);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.listarUsuarios = async (_req, res) => {
  try {
    res.json(await Usuario.find().select('-senha_hash').sort({ nome: 1 }));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.atualizarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const perfisAtuais = usuario.perfis?.length ? usuario.perfis : [usuario.perfil];
    const perfis = normalizarPerfis(req.body);

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

    usuario.nome = req.body.nome || usuario.nome;
    usuario.email = req.body.email || usuario.email;
    usuario.login = req.body.login || usuario.login;
    usuario.perfil = perfis[0];
    usuario.perfis = perfis;

    if (req.body.senha) {
      usuario.senha_hash = await bcrypt.hash(req.body.senha, 10);
    }

    await usuario.save();
    const obj = usuario.toObject();
    delete obj.senha_hash;
    res.json(obj);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.deletarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });
    if (String(usuario._id) === String(req.usuario?.id)) {
      return res.status(400).json({ erro: 'Não é possível apagar o usuário logado' });
    }

    const perfis = usuario.perfis?.length ? usuario.perfis : [usuario.perfil];

    if (perfis.includes('admin')) {
      const totalAdmins = await Usuario.countDocuments({
        _id: { $ne: usuario._id },
        ativo: true,
        $or: [{ perfil: 'admin' }, { perfis: 'admin' }],
      });

      if (totalAdmins === 0) {
        return res.status(400).json({ erro: 'Não é possível apagar o último administrador ativo' });
      }
    }

    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensagem: 'Usuário removido com sucesso' });
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
    );
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
