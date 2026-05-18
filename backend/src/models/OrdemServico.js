const mongoose = require('mongoose');

const ClienteSnapshotSchema = new mongoose.Schema({ id_cliente: String, nome: String, telefone: String, whatsapp: String }, { _id: false });
const TecnicoSnapshotSchema = new mongoose.Schema({ id_usuario: String, nome: String }, { _id: false });
const AparelhoSchema = new mongoose.Schema({
  id_aparelho: String,
  tipo_aparelho: { type: String, enum: ['celular', 'notebook'], required: true },
  marca: String, modelo: String, cor: String, imei_ou_serial: String,
  acessorios_entregues: [String], senha_informada: String, estado_fisico: String,
  defeito_relatado_inicial: String, data_cadastro: { type: Date, default: Date.now }
}, { _id: false });
const AnexoSchema = new mongoose.Schema({ id_anexo: String, nome: String, tipo: String, tamanho: Number, conteudo: String, criadoEm: { type: Date, default: Date.now } }, { _id: false });
const DiagnosticoSchema = new mongoose.Schema({ id_diagnostico: String, defeito_identificado: String, testes_realizados: [String], causa_provavel: String, solucao_recomendada: String, pecas_necessarias: [String], observacoes_tecnicas: String, anexos_avaliacao: [AnexoSchema], data_diagnostico: Date }, { _id: false });
const OrcamentoSchema = new mongoose.Schema({ id_orcamento: String, valor_mao_obra: { type: Number, default: 0 }, valor_pecas: { type: Number, default: 0 }, valor_total: { type: Number, default: 0 }, status_aprovacao: { type: String, enum: ['pendente', 'aprovado', 'rejeitado'], default: 'pendente' }, data_orcamento: Date, data_aprovacao: Date, observacao_aprovacao: String }, { _id: false });
const PecaSchema = new mongoose.Schema({ id_peca: String, nome_peca: String, tipo_peca: String, marca_peca: String, quantidade: { type: Number, default: 1 }, valor_unitario: { type: Number, default: 0 } }, { _id: false });
const ServicoExecutadoSchema = new mongoose.Schema({ id_servico: String, descricao_servico: String, pecas_trocadas: String, data_inicio: Date, data_fim: Date, data_conclusao: Date, testes_finais: mongoose.Schema.Types.Mixed, observacoes: String, observacoes_finais: String, anexos_servico: [AnexoSchema] }, { _id: false });
const PagamentoSchema = new mongoose.Schema({ id_pagamento: String, valor_bruto: { type: Number, default: 0 }, desconto: { type: Number, default: 0 }, valor_final: { type: Number, default: 0 }, forma_pagamento: { type: String, enum: ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', null], default: null }, status_pagamento: { type: String, enum: ['pendente', 'parcial', 'pago'], default: 'pendente' }, data_pagamento: Date, observacoes: String }, { _id: false });
const EntregaSchema = new mongoose.Schema({ id_entrega: String, data_entrega: Date, recebedor_nome: String, recebedor_documento: String, observacoes: String }, { _id: false });
const HistoricoStatusSchema = new mongoose.Schema({ status: String, data: { type: Date, default: Date.now }, usuario: String }, { _id: false });
const LogSchema = new mongoose.Schema({ acao: String, usuario: String, data: { type: Date, default: Date.now } }, { _id: false });
const EventoSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['sistema', 'status', 'cliente', 'tecnico', 'financeiro', 'estoque', 'garantia', 'checklist'], default: 'sistema' },
  titulo: String,
  descricao: String,
  usuario: String,
  data: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed,
}, { _id: false });
const ChecklistItemSchema = new mongoose.Schema({ chave: String, label: String, checked: { type: Boolean, default: false }, observacao: String }, { _id: false });
const ChecklistsSchema = new mongoose.Schema({
  entrada: [ChecklistItemSchema],
  saida: [ChecklistItemSchema],
}, { _id: false });
const GarantiaSchema = new mongoose.Schema({
  ativa: { type: Boolean, default: false },
  dias: { type: Number, default: 90 },
  inicio: Date,
  fim: Date,
  cobertura: String,
  observacoes: String,
}, { _id: false });

const OrdemServicoSchema = new mongoose.Schema({
  id_os: { type: String, required: true, unique: true },
  numero_os: { type: Number, required: true, unique: true },
  cliente: ClienteSnapshotSchema,
  aparelho: AparelhoSchema,
  tecnico: TecnicoSnapshotSchema,
  data_entrada: { type: Date, default: Date.now },
  defeito_relatado: { type: String, required: true },
  diagnostico_resumido: String,
  status: { type: String, enum: ['aberta','em_diagnostico','aguardando_aprovacao','aprovado','rejeitado','em_reparo','aguardando_peca','pronto','entregue','cancelada'], default: 'aberta' },
  prioridade: { type: String, enum: ['baixa','media','alta','urgente'], default: 'media' },
  prazo_estimado: Date, observacoes_gerais: String, data_conclusao: Date, data_entrega: Date,
  diagnostico: DiagnosticoSchema, orcamento: OrcamentoSchema, pecas_utilizadas: [PecaSchema], servico_executado: ServicoExecutadoSchema, pagamento: PagamentoSchema, entrega: EntregaSchema,
  anexos: [AnexoSchema],
  checklists: ChecklistsSchema,
  garantia: GarantiaSchema,
  retorno_de: String,
  reaberturas: [{ motivo: String, usuario: String, data: { type: Date, default: Date.now } }],
  eventos: [EventoSchema],
  historico_status: [HistoricoStatusSchema], logs: [LogSchema]
}, { timestamps: true });

module.exports = mongoose.model('OrdemServico', OrdemServicoSchema);
