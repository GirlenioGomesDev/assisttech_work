const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema({
  login: { type: String, required: true, trim: true, lowercase: true },
  sucesso: { type: Boolean, required: true },
  motivo: String,
  usuario: {
    id: String,
    nome: String,
    perfis: [String],
  },
  ip: String,
  user_agent: String,
}, { timestamps: true });

LoginLogSchema.index({ createdAt: -1 });
LoginLogSchema.index({ login: 1, createdAt: -1 });
LoginLogSchema.index({ sucesso: 1, createdAt: -1 });

module.exports = mongoose.model('LoginLog', LoginLogSchema);
