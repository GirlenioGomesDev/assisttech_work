const Auditoria = require('../models/Auditoria');

exports.listarAuditoria = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.entidade) filtro.entidade = req.query.entidade;
    if (req.query.acao) filtro.acao = req.query.acao;
    if (req.query.usuario) filtro['usuario.nome'] = new RegExp(req.query.usuario, 'i');

    const limit = Math.min(Number(req.query.limit || 100), 300);
    const registros = await Auditoria.find(filtro).sort({ createdAt: -1 }).limit(limit);

    res.json(registros);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
