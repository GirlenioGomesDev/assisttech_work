// Dados cadastrais do cliente atendido pela assistencia.
const mongoose = require('mongoose');
const onlyDigits = require('../utils/onlyDigits');

const EnderecoSchema = new mongoose.Schema({
  cep: String, rua: String, numero: String, bairro: String, cidade: String, estado: String, complemento: String
}, { _id: false });

const ClienteSchema = new mongoose.Schema({
  id_cliente: { type: String, required: true, unique: true },
  nome: { type: String, required: true, trim: true },
  telefone: { type: String, required: true, set: onlyDigits },
  whatsapp: { type: String, set: onlyDigits },
  cpf: { type: String, unique: true, sparse: true, set: onlyDigits },
  email: { type: String, lowercase: true, trim: true },
  endereco: EnderecoSchema,
  observacoes: { type: String },
  data_cadastro: { type: Date, default: Date.now },
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Cliente', ClienteSchema);
