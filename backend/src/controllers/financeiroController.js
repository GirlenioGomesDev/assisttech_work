// Lancamentos e resumo financeiro das ordens.
const LancamentoFinanceiro = require('../models/LancamentoFinanceiro');
const gerarCodigo = require('../utils/gerarCodigo');
const registrarAuditoria = require('../utils/auditoria');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getUsuario = (req) => ({
  id: req.usuario?.id || req.usuario?.id_usuario,
  nome: req.usuario?.nome || 'Sistema',
});

const competenciaDe = (data = new Date()) => {
  const value = new Date(data);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
};

const sanitizeLancamento = (body = {}) => {
  const vencimento = body.vencimento ? new Date(body.vencimento) : undefined;
  const dataPagamento = body.data_pagamento ? new Date(body.data_pagamento) : undefined;
  return {
    tipo: body.tipo,
    categoria: String(body.categoria || '').trim(),
    descricao: String(body.descricao || '').trim(),
    valor: Math.max(toNumber(body.valor), 0),
    status: body.status || 'pendente',
    forma_pagamento: body.forma_pagamento || null,
    vencimento,
    data_pagamento: dataPagamento,
    competencia: body.competencia || competenciaDe(dataPagamento || vencimento || new Date()),
    origem: body.origem || 'manual',
    os_id: body.os_id,
    os_codigo: body.os_codigo,
    cliente: body.cliente,
    observacoes: body.observacoes,
  };
};

const validar = (payload) => {
  const erros = [];
  if (!['receita', 'despesa'].includes(payload.tipo)) erros.push('tipo');
  if (!payload.categoria) erros.push('categoria');
  if (!payload.descricao) erros.push('descricao');
  if (payload.valor <= 0) erros.push('valor');
  if (!['pendente', 'pago', 'cancelado'].includes(payload.status)) erros.push('status');
  return erros;
};

exports.criarLancamento = async (req, res) => {
  try {
    const payload = sanitizeLancamento(req.body);
    const erros = validar(payload);
    if (erros.length) return res.status(400).json({ erro: 'Lancamento invalido', campos: erros });
    const total = await LancamentoFinanceiro.countDocuments();
    const lancamento = await LancamentoFinanceiro.create({
      ...payload,
      id_lancamento: gerarCodigo('FIN', total + 1),
      usuario: getUsuario(req),
    });
    await registrarAuditoria(req, {
      acao: 'financeiro_lancamento_criado',
      entidade: 'financeiro',
      entidade_id: lancamento._id,
      entidade_codigo: lancamento.id_lancamento,
      descricao: `Criou lancamento financeiro ${lancamento.descricao}`,
      metadata: { tipo: lancamento.tipo, valor: lancamento.valor, status: lancamento.status },
    });
    res.status(201).json(lancamento);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.listarLancamentos = async (req, res) => {
  try {
    const filtro = { ativo: true };
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    if (req.query.status) filtro.status = req.query.status;
    if (req.query.competencia) filtro.competencia = req.query.competencia;
    const limit = Math.min(Number(req.query.limit || 200), 500);
    res.json(await LancamentoFinanceiro.find(filtro).sort({ vencimento: -1, createdAt: -1 }).limit(limit).lean());
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.atualizarLancamento = async (req, res) => {
  try {
    const atual = await LancamentoFinanceiro.findById(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Lancamento nao encontrado' });
    const payload = sanitizeLancamento({ ...atual.toObject(), ...req.body });
    const erros = validar(payload);
    if (erros.length) return res.status(400).json({ erro: 'Lancamento invalido', campos: erros });
    Object.assign(atual, payload);
    await atual.save();
    await registrarAuditoria(req, {
      acao: 'financeiro_lancamento_atualizado',
      entidade: 'financeiro',
      entidade_id: atual._id,
      entidade_codigo: atual.id_lancamento,
      descricao: `Atualizou lancamento financeiro ${atual.descricao}`,
    });
    res.json(atual);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.deletarLancamento = async (req, res) => {
  try {
    const lancamento = await LancamentoFinanceiro.findByIdAndUpdate(req.params.id, { ativo: false }, { new: true });
    if (!lancamento) return res.status(404).json({ erro: 'Lancamento nao encontrado' });
    await registrarAuditoria(req, {
      acao: 'financeiro_lancamento_removido',
      entidade: 'financeiro',
      entidade_id: lancamento._id,
      entidade_codigo: lancamento.id_lancamento,
      descricao: `Removeu lancamento financeiro ${lancamento.descricao}`,
    });
    res.json({ mensagem: 'Lancamento removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.dashboardFinanceiro = async (req, res) => {
  try {
    const competencia = req.query.competencia || competenciaDe(new Date());
    const lancamentos = await LancamentoFinanceiro.find({ ativo: true, competencia }).lean();
    const receitas = lancamentos.filter((item) => item.tipo === 'receita');
    const despesas = lancamentos.filter((item) => item.tipo === 'despesa');
    const sum = (items, status) => items
      .filter((item) => !status || item.status === status)
      .reduce((total, item) => total + Number(item.valor || 0), 0);
    const porCategoria = Object.values(lancamentos.reduce((acc, item) => {
      const key = `${item.tipo}:${item.categoria}`;
      acc[key] = acc[key] || { name: item.categoria, tipo: item.tipo, valor: 0 };
      acc[key].valor += Number(item.valor || 0);
      return acc;
    }, {}));

    res.json({
      competencia,
      resumo: {
        receitas_previstas: sum(receitas),
        receitas_recebidas: sum(receitas, 'pago'),
        despesas_previstas: sum(despesas),
        despesas_pagas: sum(despesas, 'pago'),
        saldo_previsto: sum(receitas) - sum(despesas),
        saldo_realizado: sum(receitas, 'pago') - sum(despesas, 'pago'),
        pendente_receber: sum(receitas, 'pendente'),
        pendente_pagar: sum(despesas, 'pendente'),
      },
      por_categoria: porCategoria,
      lancamentos: lancamentos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.sincronizarPagamentoOS = async (req, os) => {
  if (!os?.pagamento) return;
  const valor = Number(os.pagamento.valor_final || 0);
  if (valor <= 0) return;
  const existente = await LancamentoFinanceiro.findOne({ origem: 'os', os_id: String(os._id), ativo: true });
  const payload = {
    tipo: 'receita',
    categoria: 'Ordem de servico',
    descricao: `Recebimento da OS ${os.id_os}`,
    valor,
    status: os.pagamento.status_pagamento === 'pago' ? 'pago' : 'pendente',
    forma_pagamento: os.pagamento.forma_pagamento || null,
    vencimento: os.pagamento.data_pagamento || new Date(),
    data_pagamento: os.pagamento.status_pagamento === 'pago' ? (os.pagamento.data_pagamento || new Date()) : undefined,
    competencia: competenciaDe(os.pagamento.data_pagamento || new Date()),
    origem: 'os',
    os_id: String(os._id),
    os_codigo: os.id_os,
    cliente: os.cliente,
    observacoes: os.pagamento.observacoes,
    usuario: getUsuario(req),
  };
  if (existente) {
    Object.assign(existente, payload);
    await existente.save();
    return existente;
  }
  const total = await LancamentoFinanceiro.countDocuments();
  return LancamentoFinanceiro.create({ ...payload, id_lancamento: gerarCodigo('FIN', total + 1) });
};
