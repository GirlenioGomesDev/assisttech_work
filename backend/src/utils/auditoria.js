// Helper para gravar auditoria sem quebrar o fluxo principal.
const Auditoria = require('../models/Auditoria');

const getPerfis = (usuario = {}) => (
  Array.isArray(usuario.perfis) && usuario.perfis.length ? usuario.perfis : [usuario.perfil].filter(Boolean)
);

const registrarAuditoria = async (req, dados) => {
  try {
    await Auditoria.create({
      ...dados,
      usuario: {
        id: req.usuario?.id || req.usuario?.id_usuario,
        nome: req.usuario?.nome || 'Sistema',
        perfis: getPerfis(req.usuario),
      },
    });
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error.message);
  }
};

module.exports = registrarAuditoria;
