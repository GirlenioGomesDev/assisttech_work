const mongoose = require('mongoose');

const LancamentoFinanceiroSchema = new mongoose.Schema({
  id_lancamento: { type: String, required: true, unique: true },
  tipo: { type: String, enum: ['receita', 'despesa'], required: true },
  categoria: { type: String, required: true, trim: true },
  descricao: { type: String, required: true, trim: true },
  valor: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pendente', 'pago', 'cancelado'], default: 'pendente' },
  forma_pagamento: { type: String, enum: ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'outro', null], default: null },
  vencimento: Date,
  data_pagamento: Date,
  competencia: String,
  origem: { type: String, enum: ['manual', 'os', 'estoque', 'sistema'], default: 'manual' },
  os_id: String,
  os_codigo: String,
  cliente: {
    id_cliente: String,
    nome: String,
  },
  observacoes: String,
  usuario: {
    id: String,
    nome: String,
  },
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('LancamentoFinanceiro', LancamentoFinanceiroSchema);
