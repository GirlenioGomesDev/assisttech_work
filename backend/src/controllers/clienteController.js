// CRUD e consultas ligadas aos clientes.
const Cliente = require('../models/Cliente');
const OrdemServico = require('../models/OrdemServico');
const gerarCodigo = require('../utils/gerarCodigo');
const onlyDigits = require('../utils/onlyDigits');
const registrarAuditoria = require('../utils/auditoria');

const sanitizeCliente = (data) => {
  const sanitized = { ...data };

  if ('telefone' in sanitized) sanitized.telefone = onlyDigits(sanitized.telefone);
  if ('whatsapp' in sanitized) sanitized.whatsapp = onlyDigits(sanitized.whatsapp);
  if ('cpf' in sanitized) sanitized.cpf = onlyDigits(sanitized.cpf);

  return sanitized;
};

const validarCliente = (data = {}) => {
  const erros = [];
  const telefone = onlyDigits(data.telefone);
  const cpf = onlyDigits(data.cpf);
  if (!data.nome || String(data.nome).trim().length < 2) erros.push('nome');
  if (!telefone || telefone.length < 10) erros.push('telefone');
  if (cpf && cpf.length !== 11) erros.push('cpf');
  return erros;
};

exports.criarCliente = async (req, res) => {
  try {
    const erros = validarCliente(req.body);
    if (erros.length) return res.status(400).json({ erro: 'Dados de cliente invalidos', campos: erros });
    const total = await Cliente.countDocuments();
    const cliente = new Cliente({
      ...sanitizeCliente(req.body),
      id_cliente: gerarCodigo('CLI', total + 1),
    });

    await cliente.save();
    await registrarAuditoria(req, {
      acao: 'cliente_criado',
      entidade: 'cliente',
      entidade_id: cliente._id,
      entidade_codigo: cliente.id_cliente,
      descricao: `Cadastrou o cliente ${cliente.nome}`,
    });
    res.status(201).json(cliente);
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({ erro: status === 409 ? 'CPF ja cadastrado' : error.message });
  }
};

exports.listarClientes = async (_req, res) => {
  try {
    res.json(await Cliente.find().sort({ createdAt: -1 }));
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.buscarClientePorId = async (req, res) => {
  try {
    const c = await Cliente.findById(req.params.id);
    if (!c) return res.status(404).json({ erro: 'Cliente nao encontrado' });
    res.json(c);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

const moedaNumero = (valor) => Number(valor || 0);

exports.resumoCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id).lean();
    if (!cliente) return res.status(404).json({ erro: 'Cliente nao encontrado' });

    const ordens = await OrdemServico.find({ 'cliente.id_cliente': cliente.id_cliente })
      .sort({ createdAt: -1 })
      .lean();

    const aparelhosMap = new Map();
    ordens.forEach((os) => {
      const chave = os.aparelho?.imei_ou_serial || `${os.aparelho?.marca || ''}-${os.aparelho?.modelo || ''}-${os.aparelho?.tipo_aparelho || ''}`;
      if (!chave.trim()) return;
      if (!aparelhosMap.has(chave)) {
        aparelhosMap.set(chave, {
          chave,
          tipo_aparelho: os.aparelho?.tipo_aparelho,
          marca: os.aparelho?.marca,
          modelo: os.aparelho?.modelo,
          cor: os.aparelho?.cor,
          imei_ou_serial: os.aparelho?.imei_ou_serial,
          total_os: 0,
          ultima_os: null,
        });
      }
      const aparelho = aparelhosMap.get(chave);
      aparelho.total_os += 1;
      if (!aparelho.ultima_os || new Date(os.createdAt) > new Date(aparelho.ultima_os.createdAt)) {
        aparelho.ultima_os = { _id: os._id, id_os: os.id_os, status: os.status, createdAt: os.createdAt };
      }
    });

    const totalOrcamentos = ordens.reduce((sum, os) => sum + moedaNumero(os.orcamento?.valor_total), 0);
    const totalPago = ordens.reduce((sum, os) => sum + moedaNumero(os.pagamento?.valor_final), 0);
    const pendente = ordens.reduce((sum, os) => {
      const valor = moedaNumero(os.pagamento?.valor_final || os.orcamento?.valor_total);
      return os.pagamento?.status_pagamento === 'pago' ? sum : sum + valor;
    }, 0);
    const entregues = ordens.filter((os) => os.status === 'entregue').length;
    const abertas = ordens.filter((os) => !['entregue', 'cancelada'].includes(os.status)).length;
    const canceladas = ordens.filter((os) => os.status === 'cancelada').length;
    const ticketMedio = ordens.length ? totalOrcamentos / ordens.length : 0;
    const ultimaOS = ordens[0] || null;
    const recorrente = ordens.length >= 3;
    const score = Math.max(0, Math.min(100, Math.round(
      45 +
      Math.min(ordens.length * 8, 32) +
      Math.min(entregues * 4, 16) -
      (canceladas * 8) -
      (pendente > 0 ? 10 : 0)
    )));

    res.json({
      cliente,
      resumo: {
        total_os: ordens.length,
        os_abertas: abertas,
        os_entregues: entregues,
        os_canceladas: canceladas,
        aparelhos: aparelhosMap.size,
        total_orcamentos: totalOrcamentos,
        total_pago: totalPago,
        saldo_pendente: pendente,
        ticket_medio: ticketMedio,
        recorrente,
        score,
        ultima_os: ultimaOS ? { _id: ultimaOS._id, id_os: ultimaOS.id_os, status: ultimaOS.status, createdAt: ultimaOS.createdAt } : null,
      },
      aparelhos: Array.from(aparelhosMap.values()),
      ordens,
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.atualizarCliente = async (req, res) => {
  try {
    const atual = await Cliente.findById(req.params.id);
    if (!atual) return res.status(404).json({ erro: 'Cliente nao encontrado' });

    const payload = sanitizeCliente({ ...atual.toObject(), ...req.body });
    const erros = validarCliente(payload);
    if (erros.length) return res.status(400).json({ erro: 'Dados de cliente invalidos', campos: erros });

    const c = await Cliente.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ erro: 'Cliente nao encontrado' });
    await registrarAuditoria(req, {
      acao: 'cliente_atualizado',
      entidade: 'cliente',
      entidade_id: c._id,
      entidade_codigo: c.id_cliente,
      descricao: `Atualizou o cliente ${c.nome}`,
    });
    res.json(c);
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({ erro: status === 409 ? 'CPF ja cadastrado' : error.message });
  }
};

exports.deletarCliente = async (req, res) => {
  try {
    const c = await Cliente.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ erro: 'Cliente nao encontrado' });
    await registrarAuditoria(req, {
      acao: 'cliente_removido',
      entidade: 'cliente',
      entidade_id: c._id,
      entidade_codigo: c.id_cliente,
      descricao: `Removeu o cliente ${c.nome}`,
    });
    res.json({ mensagem: 'Cliente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
