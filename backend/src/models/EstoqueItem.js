// Item cadastrado no estoque.
const mongoose = require('mongoose');

const EstoqueItemSchema = new mongoose.Schema({
  id_item: { type: String, required: true, unique: true },
  nome: { type: String, required: true, trim: true },
  categoria: { type: String, trim: true },
  marca: { type: String, trim: true },
  modelo: { type: String, trim: true },
  quantidade: { type: Number, default: 0 },
  estoque_minimo: { type: Number, default: 0 },
  valor_unitario: { type: Number, default: 0 },
  custo_medio: { type: Number, default: 0 },
  ultima_movimentacao: Date,
  fornecedor: { type: String, trim: true },
  observacoes: String,
  ativo: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('EstoqueItem', EstoqueItemSchema);
