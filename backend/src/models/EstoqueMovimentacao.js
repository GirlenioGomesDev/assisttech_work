const mongoose = require('mongoose');

const EstoqueMovimentacaoSchema = new mongoose.Schema({
  id_movimentacao: { type: String, required: true, unique: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'EstoqueItem', required: true },
  id_item: String,
  nome_item: String,
  tipo: { type: String, enum: ['entrada', 'saida', 'ajuste', 'reserva', 'baixa_os'], required: true },
  quantidade: { type: Number, required: true },
  quantidade_anterior: { type: Number, required: true },
  quantidade_atual: { type: Number, required: true },
  custo_unitario: { type: Number, default: 0 },
  origem: { type: String, enum: ['manual', 'os', 'compra', 'inventario'], default: 'manual' },
  os_id: String,
  observacao: String,
  usuario: {
    id: String,
    nome: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('EstoqueMovimentacao', EstoqueMovimentacaoSchema);
