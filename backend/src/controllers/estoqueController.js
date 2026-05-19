// Produtos, saldo e movimentacoes do estoque.
const EstoqueItem = require('../models/EstoqueItem');
const EstoqueMovimentacao = require('../models/EstoqueMovimentacao');
const gerarCodigo = require('../utils/gerarCodigo');
const registrarAuditoria = require('../utils/auditoria');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeItem = (body = {}) => ({
  nome: String(body.nome || '').trim(),
  categoria: body.categoria,
  marca: body.marca,
  modelo: body.modelo,
  quantidade: Math.max(toNumber(body.quantidade), 0),
  estoque_minimo: Math.max(toNumber(body.estoque_minimo), 0),
  valor_unitario: Math.max(toNumber(body.valor_unitario), 0),
  custo_medio: Math.max(toNumber(body.custo_medio ?? body.valor_unitario), 0),
  fornecedor: body.fornecedor,
  observacoes: body.observacoes,
});

const getUsuario = (req) => ({
  id: req.usuario?.id || req.usuario?.id_usuario,
  nome: req.usuario?.nome || 'Sistema',
});

const registrarMovimentacao = async (req, item, dados) => {
  const total = await EstoqueMovimentacao.countDocuments();
  return EstoqueMovimentacao.create({
    id_movimentacao: gerarCodigo('MOV', total + 1),
    item: item._id,
    id_item: item.id_item,
    nome_item: item.nome,
    usuario: getUsuario(req),
    ...dados,
  });
};

exports.criarItem = async (req, res) => {
  try {
    const payload = sanitizeItem(req.body);
    if (!payload.nome) return res.status(400).json({ erro: 'Nome do item e obrigatorio' });

    const total = await EstoqueItem.countDocuments();
    const item = await EstoqueItem.create({
      ...payload,
      id_item: gerarCodigo('EST', total + 1),
      ultima_movimentacao: new Date(),
    });

    if (item.quantidade > 0) {
      await registrarMovimentacao(req, item, {
        tipo: 'entrada',
        quantidade: item.quantidade,
        quantidade_anterior: 0,
        quantidade_atual: item.quantidade,
        custo_unitario: item.valor_unitario,
        origem: 'manual',
        observacao: 'Entrada inicial do cadastro',
      });
    }

    await registrarAuditoria(req, {
      acao: 'estoque_entrada',
      entidade: 'estoque',
      entidade_id: item._id,
      entidade_codigo: item.id_item,
      descricao: `Deu entrada em ${item.quantidade} unidade(s) de ${item.nome}`,
      metadata: { quantidade: item.quantidade, valor_unitario: item.valor_unitario },
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.listarItens = async (_req, res) => {
  try {
    res.json(await EstoqueItem.find({ ativo: true }).sort({ nome: 1 }).lean());
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.atualizarItem = async (req, res) => {
  try {
    const atual = await EstoqueItem.findById(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Item nao encontrado' });

    const payload = sanitizeItem({ ...atual.toObject(), ...req.body });
    const quantidadeAnterior = Number(atual.quantidade || 0);
    const quantidadeAtual = payload.quantidade;

    Object.assign(atual, payload, { ultima_movimentacao: quantidadeAnterior !== quantidadeAtual ? new Date() : atual.ultima_movimentacao });
    await atual.save();

    if (quantidadeAnterior !== quantidadeAtual) {
      await registrarMovimentacao(req, atual, {
        tipo: 'ajuste',
        quantidade: quantidadeAtual - quantidadeAnterior,
        quantidade_anterior: quantidadeAnterior,
        quantidade_atual: quantidadeAtual,
        custo_unitario: atual.valor_unitario,
        origem: 'inventario',
        observacao: req.body.observacao_movimentacao || 'Ajuste manual pelo cadastro',
      });
    }

    await registrarAuditoria(req, {
      acao: 'estoque_atualizado',
      entidade: 'estoque',
      entidade_id: atual._id,
      entidade_codigo: atual.id_item,
      descricao: `Atualizou o item de estoque ${atual.nome}`,
      metadata: { quantidade: atual.quantidade, valor_unitario: atual.valor_unitario },
    });
    res.json(atual);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.movimentarItem = async (req, res) => {
  try {
    const { tipo, origem = 'manual', observacao, os_id } = req.body;
    const quantidade = Math.abs(toNumber(req.body.quantidade));
    const custoUnitario = Math.max(toNumber(req.body.custo_unitario), 0);
    if (!['entrada', 'saida', 'ajuste', 'reserva', 'baixa_os'].includes(tipo)) return res.status(400).json({ erro: 'Tipo de movimentacao invalido' });
    if (!quantidade && tipo !== 'ajuste') return res.status(400).json({ erro: 'Quantidade deve ser maior que zero' });

    const item = await EstoqueItem.findById(req.params.id);
    if (!item || !item.ativo) return res.status(404).json({ erro: 'Item nao encontrado' });

    const anterior = Number(item.quantidade || 0);
    let atual = anterior;
    if (tipo === 'entrada') atual = anterior + quantidade;
    if (['saida', 'reserva', 'baixa_os'].includes(tipo)) atual = anterior - quantidade;
    if (tipo === 'ajuste') atual = toNumber(req.body.quantidade);
    if (atual < 0) return res.status(400).json({ erro: 'Estoque insuficiente' });

    if (tipo === 'entrada' && custoUnitario > 0) {
      const valorAnterior = anterior * Number(item.custo_medio || item.valor_unitario || 0);
      const valorEntrada = quantidade * custoUnitario;
      item.custo_medio = atual > 0 ? (valorAnterior + valorEntrada) / atual : custoUnitario;
      item.valor_unitario = item.valor_unitario || custoUnitario;
    }

    item.quantidade = atual;
    item.ultima_movimentacao = new Date();
    await item.save();

    const delta = ['saida', 'reserva', 'baixa_os'].includes(tipo) ? -quantidade : tipo === 'ajuste' ? atual - anterior : quantidade;
    await registrarMovimentacao(req, item, {
      tipo,
      quantidade: delta,
      quantidade_anterior: anterior,
      quantidade_atual: atual,
      custo_unitario: custoUnitario || item.custo_medio || item.valor_unitario,
      origem,
      os_id,
      observacao,
    });

    await registrarAuditoria(req, {
      acao: `estoque_${tipo}`,
      entidade: 'estoque',
      entidade_id: item._id,
      entidade_codigo: item.id_item,
      descricao: `Movimentou estoque de ${item.nome}: ${tipo} (${delta})`,
      metadata: { tipo, quantidade: delta, quantidade_anterior: anterior, quantidade_atual: atual, os_id },
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.listarMovimentacoes = async (req, res) => {
  try {
    const filtro = {};
    if (req.params.id) filtro.item = req.params.id;
    if (req.query.tipo) filtro.tipo = req.query.tipo;
    const limit = Math.min(Number(req.query.limit || 100), 300);
    res.json(await EstoqueMovimentacao.find(filtro).sort({ createdAt: -1 }).limit(limit).lean());
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.deletarItem = async (req, res) => {
  try {
    const item = await EstoqueItem.findByIdAndUpdate(req.params.id, { ativo: false }, { new: true });
    if (!item) return res.status(404).json({ erro: 'Item nao encontrado' });
    await registrarAuditoria(req, {
      acao: 'estoque_removido',
      entidade: 'estoque',
      entidade_id: item._id,
      entidade_codigo: item.id_item,
      descricao: `Removeu o item de estoque ${item.nome}`,
    });
    res.json({ mensagem: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
