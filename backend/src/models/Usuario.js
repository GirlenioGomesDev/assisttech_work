const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  id_usuario: { type: String, required: true, unique: true },
  nome: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  login: { type: String, required: true, unique: true, trim: true },
  senha_hash: { type: String, required: true },
  perfil: { type: String, enum: ['admin', 'atendente', 'tecnico', 'financeiro'], default: 'tecnico' },
  perfis: [{ type: String, enum: ['admin', 'atendente', 'tecnico', 'financeiro'] }],
  ativo: { type: Boolean, default: true },
  data_criacao: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);
