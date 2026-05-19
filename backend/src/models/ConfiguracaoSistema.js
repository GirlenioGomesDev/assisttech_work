// Configuracoes gerais usadas pela aplicacao.
const mongoose = require('mongoose');

const ConfiguracaoSistemaSchema = new mongoose.Schema({
  chave: { type: String, required: true, unique: true, default: 'principal' },
  empresa: {
    nome: { type: String, default: 'AssistTech' },
    razao_social: String,
    documento: String,
    telefone: String,
    whatsapp: String,
    email: String,
    site: String,
    endereco: {
      logradouro: String,
      numero: String,
      bairro: String,
      cidade: String,
      estado: String,
      cep: String,
      complemento: String,
    },
    logo_base64: String,
  },
  operacional: {
    garantia_padrao_dias: { type: Number, default: 90 },
    cobertura_garantia: { type: String, default: 'Garantia de servico conforme politica da empresa' },
    prazo_orcamento_horas: { type: Number, default: 24 },
    horario_atendimento: String,
  },
  documentos: {
    rodape_os: { type: String, default: 'Obrigado pela preferencia.' },
    termo_garantia: { type: String, default: 'A garantia cobre exclusivamente o servico executado e as pecas substituidas, conforme descrito nesta ordem de servico.' },
    observacoes_orcamento: String,
  },
  mensagens: {
    os_criada: String,
    orcamento_pronto: String,
    os_pronta: String,
    entrega: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('ConfiguracaoSistema', ConfiguracaoSistemaSchema);
