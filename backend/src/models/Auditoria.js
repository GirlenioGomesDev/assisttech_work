const mongoose = require('mongoose');

const AuditoriaSchema = new mongoose.Schema({
  acao: { type: String, required: true },
  entidade: { type: String, required: true },
  entidade_id: String,
  entidade_codigo: String,
  descricao: String,
  usuario: {
    id: String,
    nome: String,
    perfis: [String],
  },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('Auditoria', AuditoriaSchema);
