const Notificacao = require('../models/Notificacao');
const gerarCodigo = require('../utils/gerarCodigo');
const onlyDigits = require('../utils/onlyDigits');
const registrarAuditoria = require('../utils/auditoria');
const { obterConfiguracao } = require('./configuracaoController');

const getUsuario = (req) => ({
  id: req?.usuario?.id || req?.usuario?.id_usuario,
  nome: req?.usuario?.nome || 'Sistema',
});

const renderTemplate = (template, data = {}) => String(template || '').replace(/\{\{(.*?)\}\}/g, (_match, key) => {
  const path = String(key).trim().split('.');
  return path.reduce((value, part) => value?.[part], data) ?? '';
});

const templates = {
  os_criada: {
    assunto: 'OS criada',
    mensagem: 'Ola, {{cliente.nome}}! Sua OS {{os.id_os}} foi aberta para o aparelho {{aparelho}}. Acompanhe pelo link/QR Code informado pela assistencia.',
  },
  status_atualizado: {
    assunto: 'Status da OS atualizado',
    mensagem: 'Ola, {{cliente.nome}}! A OS {{os.id_os}} mudou para: {{status}}.',
  },
  orcamento_salvo: {
    assunto: 'Orcamento disponivel',
    mensagem: 'Ola, {{cliente.nome}}! O orcamento da OS {{os.id_os}} ficou em {{valor}} e esta aguardando sua aprovacao.',
  },
  pagamento_registrado: {
    assunto: 'Pagamento registrado',
    mensagem: 'Ola, {{cliente.nome}}! Registramos o pagamento da OS {{os.id_os}} no valor de {{valor}}. Obrigado!',
  },
  os_pronta: {
    assunto: 'OS pronta para retirada',
    mensagem: 'Ola, {{cliente.nome}}! Sua OS {{os.id_os}} esta pronta para retirada.',
  },
  entrega_registrada: {
    assunto: 'Entrega registrada',
    mensagem: 'Ola, {{cliente.nome}}! A entrega da OS {{os.id_os}} foi registrada. Garantia: {{garantia}}.',
  },
};

const criarNotificacao = async ({ req, canal = 'whatsapp', tipo, destinatario, entidade, entidade_id, entidade_codigo, data = {}, mensagem, assunto, metadata }) => {
  const total = await Notificacao.countDocuments();
  const config = await obterConfiguracao();
  const mensagensConfig = {
    os_criada: config.mensagens?.os_criada,
    orcamento_salvo: config.mensagens?.orcamento_pronto,
    os_pronta: config.mensagens?.os_pronta,
    entrega_registrada: config.mensagens?.entrega,
  };
  const templateBase = templates[tipo] || {};
  const template = {
    ...templateBase,
    mensagem: mensagensConfig[tipo] || templateBase.mensagem,
  };
  return Notificacao.create({
    id_notificacao: gerarCodigo('NOT', total + 1),
    canal,
    tipo,
    destinatario: {
      ...destinatario,
      telefone: onlyDigits(destinatario?.telefone),
    },
    assunto: assunto || template.assunto || tipo,
    mensagem: mensagem || renderTemplate(template.mensagem, data),
    entidade,
    entidade_id,
    entidade_codigo,
    metadata,
    criado_por: getUsuario(req),
  });
};

exports.criarNotificacao = criarNotificacao;

exports.criarManual = async (req, res) => {
  try {
    const notificacao = await criarNotificacao({
      req,
      canal: req.body.canal,
      tipo: req.body.tipo || 'manual',
      destinatario: req.body.destinatario || {},
      mensagem: req.body.mensagem,
      assunto: req.body.assunto,
      entidade: req.body.entidade,
      entidade_id: req.body.entidade_id,
      entidade_codigo: req.body.entidade_codigo,
      metadata: req.body.metadata,
    });
    await registrarAuditoria(req, {
      acao: 'notificacao_criada',
      entidade: 'notificacao',
      entidade_id: notificacao._id,
      entidade_codigo: notificacao.id_notificacao,
      descricao: `Criou notificacao ${notificacao.tipo}`,
    });
    res.status(201).json(notificacao);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.status) filtro.status = req.query.status;
    if (req.query.canal) filtro.canal = req.query.canal;
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    const limit = Math.min(Number(req.query.limit || 200), 500);
    res.json(await Notificacao.find(filtro).sort({ createdAt: -1 }).limit(limit).lean());
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.enviar = async (req, res) => {
  try {
    const notificacao = await Notificacao.findById(req.params.id);
    if (!notificacao) return res.status(404).json({ erro: 'Notificacao nao encontrada' });
    notificacao.tentativas += 1;
    notificacao.status = 'enviado';
    notificacao.enviado_em = new Date();
    notificacao.erro = undefined;
    await notificacao.save();
    await registrarAuditoria(req, {
      acao: 'notificacao_enviada',
      entidade: 'notificacao',
      entidade_id: notificacao._id,
      entidade_codigo: notificacao.id_notificacao,
      descricao: `Marcou notificacao ${notificacao.id_notificacao} como enviada`,
    });
    res.json(notificacao);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.cancelar = async (req, res) => {
  try {
    const notificacao = await Notificacao.findByIdAndUpdate(req.params.id, { status: 'cancelado' }, { new: true });
    if (!notificacao) return res.status(404).json({ erro: 'Notificacao nao encontrada' });
    res.json(notificacao);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
