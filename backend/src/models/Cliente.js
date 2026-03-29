const mongoose = require('mongoose');

const EnderecoSchema = new mongoose.Schema({
  cep: String, rua: String, numero: String, bairro: String, cidade: String, estado: String, complemento: String
}, { _id: false });

const ClienteSchema = new mongoose.Schema({
  id_cliente: { type: String, required: true, unique: true },
  nome: { type: String, required: true, trim: true },
  telefone: { type: String, required: true },
  whatsapp: { type: String },
  cpf: { type: String, unique: true, sparse: true },
  email: { type: String, lowercase: true, trim: true },
  endereco: EnderecoSchema,
  observacoes: { type: String },
  data_cadastro: { type: Date, default: Date.now },
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Cliente', ClienteSchema);
