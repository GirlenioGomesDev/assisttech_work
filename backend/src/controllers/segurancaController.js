// Dados de sessoes e logs de login para a tela de seguranca.
const LoginLog = require('../models/LoginLog');
const SessaoUsuario = require('../models/SessaoUsuario');
const registrarAuditoria = require('../utils/auditoria');

exports.resumo = async (_req, res) => {
  try {
    const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [sessoesAtivas, loginsOk24h, falhas24h, ultimosLogins, sessoes] = await Promise.all([
      SessaoUsuario.countDocuments({ status: 'ativa' }),
      LoginLog.countDocuments({ sucesso: true, createdAt: { $gte: desde24h } }),
      LoginLog.countDocuments({ sucesso: false, createdAt: { $gte: desde24h } }),
      LoginLog.find().sort({ createdAt: -1 }).limit(80).lean(),
      SessaoUsuario.find().sort({ ultimo_acesso: -1, createdAt: -1 }).limit(80).lean(),
    ]);

    res.json({ sessoesAtivas, loginsOk24h, falhas24h, ultimosLogins, sessoes });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.revogarSessao = async (req, res) => {
  try {
    const sessao = await SessaoUsuario.findByIdAndUpdate(
      req.params.id,
      { status: 'revogada', encerrada_em: new Date() },
      { new: true }
    );
    if (!sessao) return res.status(404).json({ erro: 'Sessao nao encontrada' });

    await registrarAuditoria(req, {
      acao: 'sessao_revogada',
      entidade: 'seguranca',
      entidade_id: sessao._id,
      entidade_codigo: sessao.id_sessao,
      descricao: `Revogou sessao de ${sessao.usuario?.nome || 'usuario'}`,
    });

    res.json(sessao);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
