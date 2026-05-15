const OrdemServico = require('../models/OrdemServico');
const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');
const gerarCodigo = require('../utils/gerarCodigo');
const onlyDigits = require('../utils/onlyDigits');
const registrarAuditoria = require('../utils/auditoria');

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

const sanitizeAnexos = (anexos = [], numero, allowedKinds = ['image', 'video']) => (
  Array.isArray(anexos)
    ? anexos
        .filter((anexo) => {
          const tipo = String(anexo.tipo || '');
          const tamanho = Number(anexo.tamanho || 0);
          const conteudo = String(anexo.conteudo || '');
          return (
            allowedKinds.some((kind) => tipo.startsWith(`${kind}/`)) &&
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
    os.diagnostico?.anexos_avaliacao?.length ? `Fotos da avaliacao: ${os.diagnostico.anexos_avaliacao.length} foto(s) anexada(s) ao relatorio da OS.` : '',
    '',
    'Podemos seguir com o servico?'
  ].filter((linha) => linha !== '').join('\n');
};

const enviarMensagemWhatsAppBusiness = async ({ telefone, mensagem }) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v25.0';

  if (!token || !phoneNumberId) {
    throw new Error('Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID no backend');
  }

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefone,
      type: 'text',
      text: {
        preview_url: false,
        body: mensagem,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro ao enviar mensagem pela WhatsApp Business API');
  }

  return data;
};

const dataUrlToBlob = (dataUrl) => {
  const [header, base64] = String(dataUrl || '').split(',');
  const contentType = header.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
  const bytes = Buffer.from(base64 || '', 'base64');
  return { blob: new Blob([bytes], { type: contentType }), contentType };
};

const uploadMidiaWhatsAppBusiness = async (anexo) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v25.0';
  const { blob, contentType } = dataUrlToBlob(anexo.conteudo);
  const formData = new FormData();

  formData.append('messaging_product', 'whatsapp');
  formData.append('type', contentType);
  formData.append('file', blob, anexo.nome || 'avaliacao.jpg');

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro ao enviar foto para a WhatsApp Business API');
  }

  return data.id;
};

const enviarImagemWhatsAppBusiness = async ({ telefone, mediaId, caption }) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v25.0';
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefone,
      type: 'image',
      image: {
        id: mediaId,
        caption,
      },
    }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || 'Erro ao enviar foto pela WhatsApp Business API');
  }

  return data;
};

const carregarRelatorioWhatsApp = async (id, mensagemPersonalizada) => {
  const os = await OrdemServico.findById(id);
  if (!os) {
    const error = new Error('OS não encontrada');
    error.status = 404;
    throw error;
  }

  const telefone = formatarWhatsApp(os.cliente?.whatsapp || os.cliente?.telefone);
  if (!telefone) {
    const error = new Error('Cliente sem WhatsApp ou telefone cadastrado');
    error.status = 400;
    throw error;
  }

  if (!os.diagnostico?.defeito_identificado && !os.diagnostico?.solucao_recomendada) {
    const error = new Error('Preencha e salve o diagnóstico antes de enviar a avaliação');
    error.status = 400;
    throw error;
  }

  return {
    os,
    telefone,
    mensagem: mensagemPersonalizada || montarMensagemAvaliacao(os),
  };
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
    await os.save();
    await registrarAuditoria(req, {
      acao: 'os_aberta',
      entidade: 'os',
      entidade_id: os._id,
      entidade_codigo: os.id_os,
      descricao: `Abriu a OS ${os.id_os} para ${cliente.nome}`,
      metadata: { cliente: cliente.nome, tecnico: tecnico.nome, aparelho: `${aparelho?.marca || ''} ${aparelho?.modelo || ''}`.trim() },
    });
    res.status(201).json(os);
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
    await registrarAuditoria(req, {
      acao: 'os_atualizada',
      entidade: 'os',
      entidade_id: os._id,
      entidade_codigo: os.id_os,
      descricao: `Atualizou dados da OS ${os.id_os}`,
    });
    res.json(os);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
exports.atualizarStatusOS = async (req, res) => { try { const { status, usuario } = req.body; const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.status = status; os.historico_status.push({ status, usuario }); os.logs.push({ acao: `Status alterado para ${status}`, usuario }); await os.save(); await registrarAuditoria(req, { acao: 'os_status_atualizado', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Alterou status da OS ${os.id_os} para ${status}`, metadata: { status } }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.deletarOS = async (req, res) => { try { const os = await OrdemServico.findByIdAndDelete(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); await registrarAuditoria(req, { acao: 'os_removida', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Removeu a OS ${os.id_os}` }); res.json({ mensagem: 'OS removida com sucesso' }); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarDiagnostico = async (req, res) => {
  try {
    const diagnostico = {
      ...req.body,
      anexos_avaliacao: sanitizeAnexos(req.body.anexos_avaliacao, Date.now(), ['image']),
    };
    const os = await OrdemServico.findByIdAndUpdate(req.params.id, { diagnostico }, { new: true });
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    await registrarAuditoria(req, {
      acao: 'diagnostico_salvo',
      entidade: 'os',
      entidade_id: os._id,
      entidade_codigo: os.id_os,
      descricao: `Salvou diagnóstico da OS ${os.id_os}`,
      metadata: {
        defeito_identificado: diagnostico.defeito_identificado,
        solucao_recomendada: diagnostico.solucao_recomendada,
        fotos: diagnostico.anexos_avaliacao?.length || 0,
      },
    });
    res.json(os);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
exports.salvarOrcamento = async (req, res) => { try { const orcamento = sanitizeNumericFields(req.body, ['valor_mao_obra', 'valor_pecas']); const valor_total = Number(orcamento.valor_mao_obra || 0) + Number(orcamento.valor_pecas || 0); const os = await OrdemServico.findByIdAndUpdate(req.params.id, { orcamento: { ...orcamento, valor_total } }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); await registrarAuditoria(req, { acao: 'orcamento_salvo', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Salvou orçamento da OS ${os.id_os}`, metadata: { valor_mao_obra: orcamento.valor_mao_obra, valor_pecas: orcamento.valor_pecas, valor_total } }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.gerarWhatsAppAvaliacao = async (req, res) => {
  try {
    const { telefone, mensagem } = await carregarRelatorioWhatsApp(req.params.id);
    const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

    res.json({ telefone, mensagem, url });
  } catch (error) {
    res.status(error.status || 500).json({ erro: error.message });
  }
};
exports.enviarWhatsAppAvaliacao = async (req, res) => {
  try {
    const { os, telefone, mensagem } = await carregarRelatorioWhatsApp(req.params.id, req.body?.mensagem);
    const resultado = await enviarMensagemWhatsAppBusiness({ telefone, mensagem });
    const fotos = os.diagnostico?.anexos_avaliacao || [];
    const fotosEnviadas = [];

    for (const [index, foto] of fotos.entries()) {
      const mediaId = await uploadMidiaWhatsAppBusiness(foto);
      const envio = await enviarImagemWhatsAppBusiness({
        telefone,
        mediaId,
        caption: `Foto ${index + 1} da avaliação da OS ${os.id_os}`,
      });
      fotosEnviadas.push(envio);
    }

    os.logs.push({
      acao: `Relatório de avaliação enviado pelo WhatsApp Business${fotosEnviadas.length ? ` com ${fotosEnviadas.length} foto(s)` : ''}`,
      usuario: req.usuario?.nome || 'Sistema',
    });
    await os.save();

    res.json({
      mensagem: 'Relatório enviado pelo WhatsApp Business',
      telefone,
      whatsapp: resultado,
      fotos_enviadas: fotosEnviadas.length,
    });
  } catch (error) {
    res.status(error.status || 500).json({ erro: error.message });
  }
};
exports.aprovarOrcamento = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.orcamento = { ...(os.orcamento?.toObject?.() || os.orcamento || {}), ...req.body, data_aprovacao: new Date() }; await os.save(); await registrarAuditoria(req, { acao: 'orcamento_aprovacao', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Registrou aprovação do orçamento da OS ${os.id_os}: ${req.body.status_aprovacao}`, metadata: { status_aprovacao: req.body.status_aprovacao } }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.adicionarPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.pecas_utilizadas.push(sanitizeNumericFields(req.body, ['quantidade', 'valor_unitario'])); await os.save(); res.status(201).json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.atualizarPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); const idx = os.pecas_utilizadas.findIndex(p => p.id_peca === req.params.id_peca); if (idx === -1) return res.status(404).json({ erro: 'Peça não encontrada' }); os.pecas_utilizadas[idx] = { ...os.pecas_utilizadas[idx].toObject(), ...sanitizeNumericFields(req.body, ['quantidade', 'valor_unitario']) }; await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.removerPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.pecas_utilizadas = os.pecas_utilizadas.filter(p => p.id_peca !== req.params.id_peca); await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarServico = async (req, res) => {
  try {
    const servico = {
      ...req.body,
      anexos_servico: sanitizeAnexos(req.body.anexos_servico, Date.now(), ['image']),
    };
    const os = await OrdemServico.findByIdAndUpdate(req.params.id, { servico_executado: servico }, { new: true });
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    await registrarAuditoria(req, {
      acao: 'servico_salvo',
      entidade: 'os',
      entidade_id: os._id,
      entidade_codigo: os.id_os,
      descricao: `Salvou execução do serviço da OS ${os.id_os}`,
      metadata: {
        descricao_servico: servico.descricao_servico,
        pecas_trocadas: servico.pecas_trocadas,
        fotos: servico.anexos_servico?.length || 0,
      },
    });
    res.json(os);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
exports.salvarPagamento = async (req, res) => { try { const pagamento = sanitizeNumericFields(req.body, ['valor_bruto', 'desconto']); const valor_final = Number(pagamento.valor_bruto || 0) - Number(pagamento.desconto || 0); const os = await OrdemServico.findByIdAndUpdate(req.params.id, { pagamento: { ...pagamento, valor_final } }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); await registrarAuditoria(req, { acao: 'pagamento_salvo', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Registrou pagamento da OS ${os.id_os}`, metadata: { valor_final, status_pagamento: pagamento.status_pagamento, forma_pagamento: pagamento.forma_pagamento } }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarEntrega = async (req, res) => { try { const entrega = { ...req.body, recebedor_documento: onlyDigits(req.body.recebedor_documento) }; const os = await OrdemServico.findByIdAndUpdate(req.params.id, { entrega, data_entrega: req.body.data_entrega || new Date(), status: 'entregue' }, { new: true }); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); await registrarAuditoria(req, { acao: 'entrega_registrada', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Registrou entrega da OS ${os.id_os}`, metadata: { recebedor_nome: entrega.recebedor_nome, data_entrega: entrega.data_entrega } }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
