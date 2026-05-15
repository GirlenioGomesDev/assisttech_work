const OrdemServico = require('../models/OrdemServico');
const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');
const gerarCodigo = require('../utils/gerarCodigo');
const onlyDigits = require('../utils/onlyDigits');

const sanitizeAparelho = (aparelho = {}) => ({
  ...aparelho,
  imei_ou_serial:
    aparelho.tipo_aparelho === 'celular'
      ? onlyDigits(aparelho.imei_ou_serial).slice(0, 15)
      : aparelho.imei_ou_serial,
});

const onlyDigitNumber = (value) => Number(onlyDigits(value) || 0);
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS_TOTAL_BYTES = 10 * 1024 * 1024;

const sanitizeAnexos = (anexos = [], numero) => (
  Array.isArray(anexos)
    ? anexos
        .filter((anexo) => {
          const tipo = String(anexo.tipo || '');
          const tamanho = Number(anexo.tamanho || 0);
          const conteudo = String(anexo.conteudo || '');
          return (
            (tipo.startsWith('image/') || tipo.startsWith('video/')) &&
            tamanho > 0 &&
            tamanho <= MAX_ATTACHMENT_BYTES &&
            conteudo.startsWith('data:')
          );
        })
        .slice(0, 6)
        .reduce((acc, anexo, index) => {
          const total = acc.reduce((sum, item) => sum + item.tamanho, 0);
          const tamanho = Number(anexo.tamanho || 0);

          if (total + tamanho > MAX_ATTACHMENTS_TOTAL_BYTES) return acc;

          acc.push({
            id_anexo: anexo.id_anexo || gerarCodigo('ANX', Number(`${numero}${index + 1}`)),
            nome: String(anexo.nome || `Anexo ${index + 1}`).slice(0, 180),
            tipo: String(anexo.tipo || ''),
            tamanho,
            conteudo: String(anexo.conteudo || ''),
            criadoEm: anexo.criadoEm || new Date(),
          });

          return acc;
        }, [])
    : []
);

const sanitizeNumericFields = (data, fields) => {
  const sanitized = { ...data };

  fields.forEach((field) => {
    if (field in sanitized) sanitized[field] = onlyDigitNumber(sanitized[field]);
  });

  return sanitized;
};

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarWhatsApp = (telefone) => {
  const digitos = onlyDigits(telefone);
  if (!digitos) return '';
  return digitos.startsWith('55') ? digitos : `55${digitos}`;
};

const listaOuTexto = (valor) => {
  if (Array.isArray(valor)) return valor.length ? valor.join(', ') : 'Nao informado';
  return valor || 'Nao informado';
};

const montarMensagemAvaliacao = (os) => {
  const aparelho = `${os.aparelho?.marca || ''} ${os.aparelho?.modelo || ''}`.trim() || 'aparelho';
  const pecas = listaOuTexto(os.diagnostico?.pecas_necessarias || os.servico_executado?.pecas_trocadas);
  const maoDeObra = moeda(os.orcamento?.valor_mao_obra);
  const valorPecas = moeda(os.orcamento?.valor_pecas);
  const total = moeda(os.orcamento?.valor_total);

  return [
    `Ola, ${os.cliente?.nome || 'cliente'}!`,
    '',
    `Segue a avaliacao da OS ${os.id_os} - ${aparelho}:`,
    '',
    `Problema identificado: ${os.diagnostico?.defeito_identificado || 'Nao informado'}`,
    `Causa provavel: ${os.diagnostico?.causa_provavel || 'Nao informado'}`,
    `O que precisa ser feito: ${os.diagnostico?.solucao_recomendada || 'Nao informado'}`,
    `Pecas/itens para troca: ${pecas}`,
    '',
    `Mao de obra: ${maoDeObra}`,
    `Pecas: ${valorPecas}`,
    `Total estimado: ${total}`,
    '',
    'Podemos seguir com o servico?'
  ].join('\n');
};

exports.criarOS = async (req, res) => {
  try {
    const { clienteId, tecnicoId, aparelho, defeito_relatado, prioridade, prazo_estimado, observacoes_gerais, anexos } = req.body;
    const prioridadeMap = { 'Baixa':'baixa','Média':'media','Media':'media','Alta':'alta','Urgente':'urgente','baixa':'baixa','media':'media','alta':'alta','urgente':'urgente' };
    const prioridadeFinal = prioridadeMap[prioridade] || 'media';
    const cliente = await Cliente.findById(clienteId); if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
    const tecnico = await Usuario.findById(tecnicoId); if (!tecnico) return res.status(404).json({ erro: 'Técnico não encontrado' });
    const total = await OrdemServico.countDocuments(); const numero = total + 1;
    const os = new OrdemServico({
      id_os: gerarCodigo('OS', numero), numero_os: numero,
      cliente: { id_cliente: cliente.id_cliente, nome: cliente.nome, telefone: cliente.telefone, whatsapp: cliente.whatsapp },
      tecnico: { id_usuario: tecnico.id_usuario, nome: tecnico.nome },
      aparelho: { ...sanitizeAparelho(aparelho), id_aparelho: gerarCodigo('APR', numero) },
      defeito_relatado, prioridade: prioridadeFinal, prazo_estimado, observacoes_gerais,
      anexos: sanitizeAnexos(anexos, numero),
      historico_status: [{ status: 'aberta', usuario: req.usuario?.nome || tecnico.nome }],
      logs: [{ acao: 'OS criada', usuario: req.usuario?.nome || tecnico.nome }]
    });
    await os.save(); res.status(201).json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};
exports.listarOS = async (_req, res) => { try { res.json(await OrdemServico.find().sort({ createdAt: -1 })); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.buscarOSPorId = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.atualizarOS = async (req, res) => {
  try {
    const body = {
      ...req.body,
      ...(req.body.aparelho ? { aparelho: sanitizeAparelho(req.body.aparelho) } : {}),
    };
    const os = await OrdemServico.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    res.json(os);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
exports.atualizarStatusOS = async (req, res) => { try { const { status, usuario } = req.body; const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.status = status; os.historico_status.push({ status, usuario }); os.logs.push({ acao: `Status alterado para ${status}`, usuario }); await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.deletarOS = async (req, res) => { try { const os = await OrdemServico.findByIdAndDelete(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json({ mensagem: 'OS removida com sucesso' }); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarDiagnostico = async (req, res) => { try { const os = await OrdemServico.findByIdAndUpdate(req.params.id, { diagnostico: req.body }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarOrcamento = async (req, res) => { try { const orcamento = sanitizeNumericFields(req.body, ['valor_mao_obra', 'valor_pecas']); const valor_total = Number(orcamento.valor_mao_obra || 0) + Number(orcamento.valor_pecas || 0); const os = await OrdemServico.findByIdAndUpdate(req.params.id, { orcamento: { ...orcamento, valor_total } }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.gerarWhatsAppAvaliacao = async (req, res) => {
  try {
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });

    const telefone = formatarWhatsApp(os.cliente?.whatsapp || os.cliente?.telefone);
    if (!telefone) return res.status(400).json({ erro: 'Cliente sem WhatsApp ou telefone cadastrado' });

    if (!os.diagnostico?.defeito_identificado && !os.diagnostico?.solucao_recomendada) {
      return res.status(400).json({ erro: 'Preencha e salve o diagnóstico antes de enviar a avaliação' });
    }

    const mensagem = montarMensagemAvaliacao(os);
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

    res.json({ telefone, mensagem, url });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
exports.aprovarOrcamento = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.orcamento = { ...(os.orcamento?.toObject?.() || os.orcamento || {}), ...req.body, data_aprovacao: new Date() }; await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.adicionarPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.pecas_utilizadas.push(sanitizeNumericFields(req.body, ['quantidade', 'valor_unitario'])); await os.save(); res.status(201).json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.atualizarPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); const idx = os.pecas_utilizadas.findIndex(p => p.id_peca === req.params.id_peca); if (idx === -1) return res.status(404).json({ erro: 'Peça não encontrada' }); os.pecas_utilizadas[idx] = { ...os.pecas_utilizadas[idx].toObject(), ...sanitizeNumericFields(req.body, ['quantidade', 'valor_unitario']) }; await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.removerPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.pecas_utilizadas = os.pecas_utilizadas.filter(p => p.id_peca !== req.params.id_peca); await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarServico = async (req, res) => { try { const os = await OrdemServico.findByIdAndUpdate(req.params.id, { servico_executado: req.body }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarPagamento = async (req, res) => { try { const pagamento = sanitizeNumericFields(req.body, ['valor_bruto', 'desconto']); const valor_final = Number(pagamento.valor_bruto || 0) - Number(pagamento.desconto || 0); const os = await OrdemServico.findByIdAndUpdate(req.params.id, { pagamento: { ...pagamento, valor_final } }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarEntrega = async (req, res) => { try { const entrega = { ...req.body, recebedor_documento: onlyDigits(req.body.recebedor_documento) }; const os = await OrdemServico.findByIdAndUpdate(req.params.id, { entrega, data_entrega: req.body.data_entrega || new Date(), status: 'entregue' }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
