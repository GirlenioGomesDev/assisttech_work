const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { login, senha } = req.body;
    const usuario = await Usuario.findOne({ login, ativo: true });
    if (!usuario) return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) return res.status(401).json({ erro: 'Usuário ou senha inválidos' });
    const token = jwt.sign({ id: usuario._id, id_usuario: usuario.id_usuario, nome: usuario.nome, perfil: usuario.perfil }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ mensagem: 'Login realizado com sucesso', token, usuario: { id_usuario: usuario.id_usuario, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
