const EstoqueItem = require('../models/EstoqueItem');
const gerarCodigo = require('../utils/gerarCodigo');
const registrarAuditoria = require('../utils/auditoria');

const toNumber = (value) => Number(value || 0);
const toNumber = (value) => {
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

const sanitizeItem = (body = {}) => ({
  nome: body.nome,
  categoria: body.categoria,
  marca: body.marca,
  modelo: body.modelo,
  quantidade: toNumber(body.quantidade),
  estoque_minimo: toNumber(body.estoque_minimo),
  valor_unitario: toNumber(body.valor_unitario),
  fornecedor: body.fornecedor,
  observacoes: body.observacoes,
});

exports.criarItem = async (req, res) => {
  try {
    const total = await EstoqueItem.countDocuments();
    const item = await EstoqueItem.create({
      ...sanitizeItem(req.body),
      id_item: gerarCodigo('EST', total + 1),
    });

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
    res.json(await EstoqueItem.find({ ativo: true }).sort({ nome: 1 }));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.atualizarItem = async (req, res) => {
  try {
    const item = await EstoqueItem.findByIdAndUpdate(
      req.params.id,
      sanitizeItem(req.body),
      { new: true }
    );

    if (!item) return res.status(404).json({ erro: 'Item não encontrado' });
    await registrarAuditoria(req, {
      acao: 'estoque_atualizado',
      entidade: 'estoque',
      entidade_id: item._id,
      entidade_codigo: item.id_item,
      descricao: `Atualizou o item de estoque ${item.nome}`,
      metadata: { quantidade: item.quantidade, valor_unitario: item.valor_unitario },
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.deletarItem = async (req, res) => {
  try {
    const item = await EstoqueItem.findByIdAndUpdate(req.params.id, { ativo: false }, { new: true });
    if (!item) return res.status(404).json({ erro: 'Item não encontrado' });
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
