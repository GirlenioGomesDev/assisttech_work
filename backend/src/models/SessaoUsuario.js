const mongoose = require('mongoose');

const SessaoUsuarioSchema = new mongoose.Schema({
  id_sessao: { type: String, required: true, unique: true },
  usuario: {
    id: { type: String, required: true },
    id_usuario: String,
    nome: String,
    email: String,
    perfis: [String],
  },
  status: { type: String, enum: ['ativa', 'encerrada', 'expirada', 'revogada'], default: 'ativa' },
  ip: String,
  user_agent: String,
  ultimo_acesso: { type: Date, default: Date.now },
  expira_em: Date,
  encerrada_em: Date,
}, { timestamps: true });

SessaoUsuarioSchema.index({ id_sessao: 1, status: 1 });
SessaoUsuarioSchema.index({ 'usuario.id': 1, status: 1 });
SessaoUsuarioSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SessaoUsuario', SessaoUsuarioSchema);
