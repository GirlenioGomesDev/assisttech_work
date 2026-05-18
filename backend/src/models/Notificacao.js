const mongoose = require('mongoose');

const NotificacaoSchema = new mongoose.Schema({
  id_notificacao: { type: String, required: true, unique: true },
  canal: { type: String, enum: ['whatsapp', 'email', 'interno'], required: true },
  tipo: { type: String, required: true },
  status: { type: String, enum: ['pendente', 'enviado', 'erro', 'cancelado'], default: 'pendente' },
  destinatario: {
    nome: String,
    telefone: String,
    email: String,
    id_cliente: String,
  },
  assunto: String,
  mensagem: { type: String, required: true },
  entidade: String,
  entidade_id: String,
  entidade_codigo: String,
  agendado_para: Date,
  enviado_em: Date,
  erro: String,
  tentativas: { type: Number, default: 0 },
  metadata: mongoose.Schema.Types.Mixed,
  criado_por: {
    id: String,
    nome: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Notificacao', NotificacaoSchema);
