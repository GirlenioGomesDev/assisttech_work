const Cliente = require('../models/Cliente');
const gerarCodigo = require('../utils/gerarCodigo');
const onlyDigits = require('../utils/onlyDigits');

const sanitizeCliente = (data) => {
  const sanitized = { ...data };

  if ('telefone' in sanitized) sanitized.telefone = onlyDigits(sanitized.telefone);
  if ('whatsapp' in sanitized) sanitized.whatsapp = onlyDigits(sanitized.whatsapp);
  if ('cpf' in sanitized) sanitized.cpf = onlyDigits(sanitized.cpf);

  return sanitized;
};

exports.criarCliente = async (req, res) => {
  try {
    const total = await Cliente.countDocuments();
    const cliente = new Cliente({
      ...sanitizeCliente(req.body),
      id_cliente: gerarCodigo('CLI', total + 1),
    });

    await cliente.save();
    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ erro: error.message });
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

exports.atualizarCliente = async (req, res) => {
  try {
    const c = await Cliente.findByIdAndUpdate(req.params.id, sanitizeCliente(req.body), { new: true });
    if (!c) return res.status(404).json({ erro: 'Cliente nao encontrado' });
    res.json(c);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.deletarCliente = async (req, res) => {
  try {
    const c = await Cliente.findByIdAndDelete(req.params.id);
    if (!c) return res.status(404).json({ erro: 'Cliente nao encontrado' });
    res.json({ mensagem: 'Cliente removido com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
