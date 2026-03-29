const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const gerarCodigo = require('../utils/gerarCodigo');

exports.criarUsuario = async (req, res) => {
  try {
    const total = await Usuario.countDocuments();
    const senha_hash = await bcrypt.hash(req.body.senha, 10);
    const usuario = new Usuario({
      ...req.body,
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

exports.listarTecnicos = async (_req, res) => {
  try {
    res.json(
      await Usuario.find({ perfil: 'tecnico', ativo: true })
        .select('-senha_hash')
        .sort({ nome: 1 })
    );
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
