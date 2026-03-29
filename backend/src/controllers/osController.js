const OrdemServico = require('../models/OrdemServico');
const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');
const gerarCodigo = require('../utils/gerarCodigo');

exports.criarOS = async (req, res) => {
  try {
    const { clienteId, tecnicoId, aparelho, defeito_relatado, prioridade, prazo_estimado, observacoes_gerais } = req.body;
    const prioridadeMap = { 'Baixa':'baixa','Média':'media','Media':'media','Alta':'alta','Urgente':'urgente','baixa':'baixa','media':'media','alta':'alta','urgente':'urgente' };
    const prioridadeFinal = prioridadeMap[prioridade] || 'media';
    const cliente = await Cliente.findById(clienteId); if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
    const tecnico = await Usuario.findById(tecnicoId); if (!tecnico) return res.status(404).json({ erro: 'Técnico não encontrado' });
    const total = await OrdemServico.countDocuments(); const numero = total + 1;
    const os = new OrdemServico({
      id_os: gerarCodigo('OS', numero), numero_os: numero,
      cliente: { id_cliente: cliente.id_cliente, nome: cliente.nome, telefone: cliente.telefone, whatsapp: cliente.whatsapp },
      tecnico: { id_usuario: tecnico.id_usuario, nome: tecnico.nome },
      aparelho: { ...aparelho, id_aparelho: gerarCodigo('APR', numero) },
      defeito_relatado, prioridade: prioridadeFinal, prazo_estimado, observacoes_gerais,
      historico_status: [{ status: 'aberta', usuario: req.usuario?.nome || tecnico.nome }],
      logs: [{ acao: 'OS criada', usuario: req.usuario?.nome || tecnico.nome }]
    });
    await os.save(); res.status(201).json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};
exports.listarOS = async (_req, res) => { try { res.json(await OrdemServico.find().sort({ createdAt: -1 })); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.buscarOSPorId = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.atualizarOS = async (req, res) => { try { const os = await OrdemServico.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.atualizarStatusOS = async (req, res) => { try { const { status, usuario } = req.body; const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.status = status; os.historico_status.push({ status, usuario }); os.logs.push({ acao: `Status alterado para ${status}`, usuario }); await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.deletarOS = async (req, res) => { try { const os = await OrdemServico.findByIdAndDelete(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json({ mensagem: 'OS removida com sucesso' }); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarDiagnostico = async (req, res) => { try { const os = await OrdemServico.findByIdAndUpdate(req.params.id, { diagnostico: req.body }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarOrcamento = async (req, res) => { try { const valor_total = Number(req.body.valor_mao_obra || 0) + Number(req.body.valor_pecas || 0); const os = await OrdemServico.findByIdAndUpdate(req.params.id, { orcamento: { ...req.body, valor_total } }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.aprovarOrcamento = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.orcamento = { ...(os.orcamento?.toObject?.() || os.orcamento || {}), ...req.body, data_aprovacao: new Date() }; await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.adicionarPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.pecas_utilizadas.push(req.body); await os.save(); res.status(201).json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.atualizarPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); const idx = os.pecas_utilizadas.findIndex(p => p.id_peca === req.params.id_peca); if (idx === -1) return res.status(404).json({ erro: 'Peça não encontrada' }); os.pecas_utilizadas[idx] = { ...os.pecas_utilizadas[idx].toObject(), ...req.body }; await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.removerPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.pecas_utilizadas = os.pecas_utilizadas.filter(p => p.id_peca !== req.params.id_peca); await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarServico = async (req, res) => { try { const os = await OrdemServico.findByIdAndUpdate(req.params.id, { servico_executado: req.body }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarPagamento = async (req, res) => { try { const valor_final = Number(req.body.valor_bruto || 0) - Number(req.body.desconto || 0); const os = await OrdemServico.findByIdAndUpdate(req.params.id, { pagamento: { ...req.body, valor_final } }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarEntrega = async (req, res) => { try { const os = await OrdemServico.findByIdAndUpdate(req.params.id, { entrega: req.body, data_entrega: req.body.data_entrega || new Date(), status: 'entregue' }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
