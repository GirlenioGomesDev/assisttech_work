const OrdemServico = require('../models/OrdemServico');
const Cliente = require('../models/Cliente');
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const gerarCodigo = require('../utils/gerarCodigo');
const onlyDigits = require('../utils/onlyDigits');
const registrarAuditoria = require('../utils/auditoria');
const { sincronizarPagamentoOS } = require('./financeiroController');
const { criarNotificacao } = require('./notificacaoController');
const { obterConfiguracao } = require('./configuracaoController');

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
const STATUS_VALIDOS = ['aberta','em_diagnostico','aguardando_aprovacao','aprovado','rejeitado','em_reparo','aguardando_peca','pronto','entregue','cancelada'];
const PRIORIDADES_VALIDAS = ['baixa','media','alta','urgente'];
const STATUS_APROVACAO_VALIDOS = ['pendente', 'aprovado', 'rejeitado'];
const STATUS_PAGAMENTO_VALIDOS = ['pendente', 'parcial', 'pago'];
const FORMAS_PAGAMENTO_VALIDAS = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', null];

const pick = (source = {}, fields = []) => fields.reduce((acc, field) => {
  if (source[field] !== undefined) acc[field] = source[field];
  return acc;
}, {});

const badRequest = (res, erro, campos = []) => res.status(400).json({ erro, ...(campos.length ? { campos } : {}) });

const CHECKLIST_ENTRADA_PADRAO = [
  { chave: 'fotos_entrada', label: 'Fotos do aparelho registradas', checked: false },
  { chave: 'imei_serial', label: 'IMEI ou serial conferido', checked: false },
  { chave: 'acessorios', label: 'Acessorios conferidos', checked: false },
  { chave: 'estado_fisico', label: 'Estado fisico documentado', checked: false },
  { chave: 'senha_autorizacao', label: 'Senha/autorizacao registrada quando necessario', checked: false },
];

const CHECKLIST_SAIDA_PADRAO = [
  { chave: 'testes_finais', label: 'Testes finais realizados', checked: false },
  { chave: 'limpeza', label: 'Aparelho limpo e revisado', checked: false },
  { chave: 'pagamento', label: 'Pagamento conferido', checked: false },
  { chave: 'garantia', label: 'Garantia explicada ao cliente', checked: false },
  { chave: 'assinatura_entrega', label: 'Entrega/retirada confirmada', checked: false },
];

const getUsuarioNome = (req) => req.usuario?.nome || 'Sistema';

const registrarEventoOS = (os, req, { tipo = 'sistema', titulo, descricao, metadata } = {}) => {
  os.eventos = os.eventos || [];
  os.eventos.push({
    tipo,
    titulo,
    descricao,
    usuario: getUsuarioNome(req),
    metadata,
  });
};

const aparelhoLabel = (os) => `${os.aparelho?.marca || ''} ${os.aparelho?.modelo || ''}`.trim() || os.aparelho?.tipo_aparelho || 'aparelho';
const destinatarioOS = (os) => ({
  nome: os.cliente?.nome,
  telefone: os.cliente?.whatsapp || os.cliente?.telefone,
  id_cliente: os.cliente?.id_cliente,
});

const notificarOS = async (req, os, tipo, data = {}) => {
  try {
    if (!os?.cliente?.telefone && !os?.cliente?.whatsapp) return;
    await criarNotificacao({
      req,
      canal: 'whatsapp',
      tipo,
      destinatario: destinatarioOS(os),
      entidade: 'os',
      entidade_id: String(os._id),
      entidade_codigo: os.id_os,
      data: {
        os,
        cliente: os.cliente,
        aparelho: aparelhoLabel(os),
        ...data,
      },
      metadata: { status: os.status },
    });
  } catch (error) {
    console.error('Erro ao criar notificacao da OS:', error.message);
  }
};

const normalizarChecklist = (items = [], padrao = []) => {
  const porChave = new Map((Array.isArray(items) ? items : []).map((item) => [item.chave, item]));
  return padrao.map((item) => ({
    ...item,
    ...(porChave.get(item.chave) || {}),
    checked: Boolean(porChave.get(item.chave)?.checked),
  }));
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatarDataBR = (data) => {
  if (!data) return 'Nao informado';
  const value = new Date(data);
  return Number.isNaN(value.getTime()) ? 'Nao informado' : value.toLocaleString('pt-BR');
};

const checklistHtml = (titulo, items = []) => `
  <section>
    <h2>${escapeHtml(titulo)}</h2>
    <table>
      <tbody>
        ${(items || []).map((item) => `
          <tr>
            <td class="check">${item.checked ? 'X' : ''}</td>
            <td>${escapeHtml(item.label || item.chave)}</td>
            <td>${escapeHtml(item.observacao || '')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </section>
`;

const enderecoEmpresa = (empresa = {}) => {
  const endereco = empresa.endereco || {};
  return [
    [endereco.logradouro, endereco.numero].filter(Boolean).join(', '),
    endereco.complemento,
    endereco.bairro,
    [endereco.cidade, endereco.estado].filter(Boolean).join(' - '),
    endereco.cep,
  ].filter(Boolean).join(' | ');
};

const montarDocumentoOS = (os, { publicUrl, config = {} } = {}) => {
  const empresa = config.empresa || {};
  const documentos = config.documentos || {};
  const total = moeda(os.orcamento?.valor_total);
  const garantiaFim = os.garantia?.fim ? formatarDataBR(os.garantia.fim) : 'Nao registrada';
  const logo = empresa.logo_base64 ? `<img src="${escapeHtml(empresa.logo_base64)}" alt="Logo" class="logo" />` : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>OS ${escapeHtml(os.id_os)}</title>
  <style>
    * { box-sizing: border-box; }
    body { color: #111827; font-family: Arial, sans-serif; margin: 0; padding: 32px; }
    header { align-items: flex-start; border-bottom: 2px solid #111827; display: flex; justify-content: space-between; padding-bottom: 18px; }
    h1 { font-size: 26px; margin: 0 0 6px; }
    h2 { border-bottom: 1px solid #e5e7eb; font-size: 15px; margin: 22px 0 10px; padding-bottom: 6px; text-transform: uppercase; }
    p { margin: 4px 0; }
    .muted { color: #6b7280; font-size: 12px; }
    .brand { align-items: flex-start; display: flex; gap: 14px; }
    .logo { border-radius: 8px; max-height: 64px; max-width: 140px; object-fit: contain; }
    .badge { border: 1px solid #111827; border-radius: 999px; display: inline-block; font-size: 12px; padding: 4px 10px; text-transform: uppercase; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #d1d5db; font-size: 12px; padding: 8px; text-align: left; vertical-align: top; }
    .check { text-align: center; width: 38px; }
    .signatures { display: grid; gap: 24px; grid-template-columns: 1fr 1fr; margin-top: 48px; }
    .signature { border-top: 1px solid #111827; padding-top: 8px; text-align: center; }
    @media print { body { padding: 18px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()" style="margin-bottom:16px;padding:8px 12px">Imprimir</button>
  <header>
    <div class="brand">
      ${logo}
      <div>
      <h1>${escapeHtml(empresa.nome || 'AssistTech')}</h1>
      <p class="muted">${escapeHtml(empresa.razao_social || 'Ordem de Servico profissional')}</p>
      <p class="muted">${escapeHtml([empresa.documento, empresa.telefone || empresa.whatsapp, empresa.email].filter(Boolean).join(' | '))}</p>
      <p class="muted">${escapeHtml(enderecoEmpresa(empresa))}</p>
      <p><strong>OS:</strong> ${escapeHtml(os.id_os)} | <strong>Numero:</strong> ${escapeHtml(os.numero_os)}</p>
      </div>
    </div>
    <div>
      <span class="badge">${escapeHtml(os.status || 'aberta')}</span>
      <p class="muted">Entrada: ${formatarDataBR(os.createdAt || os.data_entrada)}</p>
      <p class="muted">Previsao: ${formatarDataBR(os.prazo_estimado)}</p>
    </div>
  </header>

  <section class="grid">
    <div class="box">
      <h2>Cliente</h2>
      <p><strong>Nome:</strong> ${escapeHtml(os.cliente?.nome || 'Nao informado')}</p>
      <p><strong>Telefone:</strong> ${escapeHtml(os.cliente?.telefone || os.cliente?.whatsapp || 'Nao informado')}</p>
    </div>
    <div class="box">
      <h2>Aparelho</h2>
      <p><strong>Tipo:</strong> ${escapeHtml(os.aparelho?.tipo_aparelho || 'Nao informado')}</p>
      <p><strong>Marca/modelo:</strong> ${escapeHtml(`${os.aparelho?.marca || ''} ${os.aparelho?.modelo || ''}`.trim() || 'Nao informado')}</p>
      <p><strong>IMEI/Serial:</strong> ${escapeHtml(os.aparelho?.imei_ou_serial || 'Nao informado')}</p>
      <p><strong>Acessorios:</strong> ${escapeHtml(Array.isArray(os.aparelho?.acessorios_entregues) ? os.aparelho.acessorios_entregues.join(', ') : os.aparelho?.acessorios_entregues || 'Nao informado')}</p>
    </div>
  </section>

  <section>
    <h2>Defeito relatado</h2>
    <p>${escapeHtml(os.defeito_relatado || 'Nao informado')}</p>
    <p><strong>Estado fisico:</strong> ${escapeHtml(os.aparelho?.estado_fisico || 'Nao informado')}</p>
  </section>

  <section>
    <h2>Diagnostico e orcamento</h2>
    <p><strong>Diagnostico:</strong> ${escapeHtml(os.diagnostico?.defeito_identificado || 'Pendente')}</p>
    <p><strong>Solucao:</strong> ${escapeHtml(os.diagnostico?.solucao_recomendada || 'Pendente')}</p>
    <p><strong>Total:</strong> ${escapeHtml(total)}</p>
    <p><strong>Aprovacao:</strong> ${escapeHtml(os.orcamento?.status_aprovacao || 'pendente')}</p>
  </section>

  ${checklistHtml('Checklist de entrada', os.checklists?.entrada || [])}
  ${checklistHtml('Checklist de saida', os.checklists?.saida || [])}

  <section>
    <h2>Garantia</h2>
    <p><strong>Cobertura:</strong> ${escapeHtml(os.garantia?.cobertura || 'Nao registrada')}</p>
    <p><strong>Validade:</strong> ${escapeHtml(garantiaFim)}</p>
    <p>${escapeHtml(documentos.termo_garantia || '')}</p>
  </section>

  ${publicUrl ? `<section><h2>Acompanhamento</h2><p>${escapeHtml(publicUrl)}</p></section>` : ''}

  <div class="signatures">
    <div class="signature">Assinatura do cliente</div>
    <div class="signature">Responsavel pela assistencia</div>
  </div>
  <footer class="muted" style="border-top:1px solid #e5e7eb;margin-top:28px;padding-top:10px">${escapeHtml(documentos.rodape_os || '')}</footer>
</body>
</html>`;
};

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
    const camposInvalidos = [];
    if (!clienteId) camposInvalidos.push('clienteId');
    if (!tecnicoId) camposInvalidos.push('tecnicoId');
    if (!defeito_relatado || String(defeito_relatado).trim().length < 3) camposInvalidos.push('defeito_relatado');
    if (!aparelho?.tipo_aparelho || !['celular', 'notebook'].includes(aparelho.tipo_aparelho)) camposInvalidos.push('aparelho.tipo_aparelho');
    if (!aparelho?.marca) camposInvalidos.push('aparelho.marca');
    if (!aparelho?.modelo) camposInvalidos.push('aparelho.modelo');
    if (camposInvalidos.length) return badRequest(res, 'Dados da OS invalidos', camposInvalidos);

    const prioridadeMap = { 'Baixa':'baixa','Média':'media','Media':'media','Alta':'alta','Urgente':'urgente','baixa':'baixa','media':'media','alta':'alta','urgente':'urgente' };
    const prioridadeFinal = prioridadeMap[prioridade] || 'media';
    if (!PRIORIDADES_VALIDAS.includes(prioridadeFinal)) return badRequest(res, 'Prioridade invalida', ['prioridade']);
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
      checklists: {
        entrada: CHECKLIST_ENTRADA_PADRAO,
        saida: CHECKLIST_SAIDA_PADRAO,
      },
      historico_status: [{ status: 'aberta', usuario: req.usuario?.nome || tecnico.nome }],
      logs: [{ acao: 'OS criada', usuario: req.usuario?.nome || tecnico.nome }],
      eventos: [{
        tipo: 'sistema',
        titulo: 'OS aberta',
        descricao: `Ordem de servico criada para ${cliente.nome}`,
        usuario: getUsuarioNome(req),
        metadata: { status: 'aberta', prioridade: prioridadeFinal },
      }],
    });
    await os.save();
    await notificarOS(req, os, 'os_criada');
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
exports.listarOS = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.status && STATUS_VALIDOS.includes(req.query.status)) filtro.status = req.query.status;
    if (req.query.cliente) filtro['cliente.id_cliente'] = req.query.cliente;
    if (req.query.tecnico) filtro['tecnico.id_usuario'] = req.query.tecnico;
    const wantsPagination = req.query.page || req.query.limit || req.query.status || req.query.cliente || req.query.tecnico;
    if (!wantsPagination) return res.json(await OrdemServico.find(filtro).sort({ createdAt: -1 }).lean());
    const limit = Math.min(Number(req.query.limit || 100), 300);
    const page = Math.max(Number(req.query.page || 1), 1);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      OrdemServico.find(filtro).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OrdemServico.countDocuments(filtro),
    ]);
    res.json({ items, total, page, limit });
  } catch (error) { res.status(500).json({ erro: error.message }); }
};
exports.buscarOSPorId = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.atualizarOS = async (req, res) => {
  try {
    const allowedOsFields = ['defeito_relatado', 'prioridade', 'prazo_estimado', 'observacoes_gerais'];
    const allowedAparelhoFields = ['tipo_aparelho', 'marca', 'modelo', 'cor', 'imei_ou_serial', 'acessorios_entregues', 'senha_informada', 'estado_fisico', 'defeito_relatado_inicial'];
    const body = {
      ...pick(req.body, allowedOsFields),
      ...(req.body.aparelho ? { aparelho: sanitizeAparelho(pick(req.body.aparelho, allowedAparelhoFields)) } : {}),
    };
    if (body.prioridade && !PRIORIDADES_VALIDAS.includes(body.prioridade)) return badRequest(res, 'Prioridade invalida', ['prioridade']);
    const osAtual = await OrdemServico.findById(req.params.id);
    if (!osAtual) return res.status(404).json({ erro: 'OS não encontrada' });
    if (body.aparelho) body.aparelho = { ...(osAtual.aparelho?.toObject?.() || osAtual.aparelho || {}), ...body.aparelho };
    Object.assign(osAtual, body);
    registrarEventoOS(osAtual, req, {
      tipo: 'sistema',
      titulo: 'Dados da OS atualizados',
      descricao: 'Informacoes principais da ordem de servico foram alteradas',
    });
    const os = await osAtual.save();
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
exports.atualizarStatusOS = async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUS_VALIDOS.includes(status)) return badRequest(res, 'Status invalido', ['status']);
    const usuario = req.usuario?.nome || 'Sistema';
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    os.status = status;
    os.historico_status.push({ status, usuario });
    os.logs.push({ acao: `Status alterado para ${status}`, usuario });
    registrarEventoOS(os, req, {
      tipo: 'status',
      titulo: 'Status alterado',
      descricao: `Status alterado para ${status}`,
      metadata: { status },
    });
    await os.save();
    await notificarOS(req, os, status === 'pronto' ? 'os_pronta' : 'status_atualizado', { status });
    await registrarAuditoria(req, { acao: 'os_status_atualizado', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Alterou status da OS ${os.id_os} para ${status}`, metadata: { status } });
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};
exports.deletarOS = async (req, res) => { try { const os = await OrdemServico.findByIdAndDelete(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); await registrarAuditoria(req, { acao: 'os_removida', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Removeu a OS ${os.id_os}` }); res.json({ mensagem: 'OS removida com sucesso' }); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarDiagnostico = async (req, res) => {
  try {
    const diagnosticoFields = ['defeito_identificado', 'testes_realizados', 'causa_provavel', 'solucao_recomendada', 'pecas_necessarias', 'observacoes_tecnicas', 'data_diagnostico'];
    const diagnostico = {
      ...pick(req.body, diagnosticoFields),
      anexos_avaliacao: sanitizeAnexos(req.body.anexos_avaliacao, Date.now(), ['image']),
    };
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    os.diagnostico = diagnostico;
    registrarEventoOS(os, req, {
      tipo: 'tecnico',
      titulo: 'Diagnostico salvo',
      descricao: diagnostico.defeito_identificado || 'Diagnostico tecnico atualizado',
      metadata: { fotos: diagnostico.anexos_avaliacao?.length || 0 },
    });
    await os.save();
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
exports.salvarOrcamento = async (req, res) => {
  try {
    const orcamento = sanitizeNumericFields(pick(req.body, ['valor_mao_obra', 'valor_pecas', 'status_aprovacao', 'observacao_aprovacao', 'data_orcamento']), ['valor_mao_obra', 'valor_pecas']);
    if (orcamento.status_aprovacao && !STATUS_APROVACAO_VALIDOS.includes(orcamento.status_aprovacao)) return badRequest(res, 'Status de aprovacao invalido', ['status_aprovacao']);
    const valor_total = Number(orcamento.valor_mao_obra || 0) + Number(orcamento.valor_pecas || 0);
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    os.orcamento = { ...orcamento, valor_total };
    registrarEventoOS(os, req, {
      tipo: 'financeiro',
      titulo: 'Orcamento salvo',
      descricao: `Orcamento registrado no valor de ${moeda(valor_total)}`,
      metadata: { valor_total },
    });
    await os.save();
    await notificarOS(req, os, 'orcamento_salvo', { valor: moeda(valor_total) });
    await registrarAuditoria(req, { acao: 'orcamento_salvo', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Salvou orçamento da OS ${os.id_os}`, metadata: { valor_mao_obra: orcamento.valor_mao_obra, valor_pecas: orcamento.valor_pecas, valor_total } });
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};
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
exports.aprovarOrcamento = async (req, res) => {
  try {
    const status_aprovacao = req.body.status_aprovacao;
    if (!['aprovado', 'rejeitado'].includes(status_aprovacao)) return badRequest(res, 'Status de aprovacao invalido', ['status_aprovacao']);
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    os.orcamento = { ...(os.orcamento?.toObject?.() || os.orcamento || {}), status_aprovacao, observacao_aprovacao: req.body.observacao_aprovacao, data_aprovacao: new Date() };
    registrarEventoOS(os, req, {
      tipo: 'cliente',
      titulo: status_aprovacao === 'aprovado' ? 'Orcamento aprovado' : 'Orcamento rejeitado',
      descricao: req.body.observacao_aprovacao || `Cliente ${status_aprovacao === 'aprovado' ? 'aprovou' : 'rejeitou'} o orcamento`,
      metadata: { status_aprovacao },
    });
    await os.save();
    await registrarAuditoria(req, { acao: 'orcamento_aprovacao', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Registrou aprovação do orçamento da OS ${os.id_os}: ${status_aprovacao}`, metadata: { status_aprovacao } });
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};
exports.adicionarPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.pecas_utilizadas.push(sanitizeNumericFields(req.body, ['quantidade', 'valor_unitario'])); await os.save(); res.status(201).json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.atualizarPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); const idx = os.pecas_utilizadas.findIndex(p => p.id_peca === req.params.id_peca); if (idx === -1) return res.status(404).json({ erro: 'Peça não encontrada' }); os.pecas_utilizadas[idx] = { ...os.pecas_utilizadas[idx].toObject(), ...sanitizeNumericFields(req.body, ['quantidade', 'valor_unitario']) }; await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.removerPeca = async (req, res) => { try { const os = await OrdemServico.findById(req.params.id); if (!os) return res.status(404).json({ erro: 'OS não encontrada' }); os.pecas_utilizadas = os.pecas_utilizadas.filter(p => p.id_peca !== req.params.id_peca); await os.save(); res.json(os); } catch (error) { res.status(500).json({ erro: error.message }); } };
exports.salvarServico = async (req, res) => {
  try {
    const servicoFields = ['descricao_servico', 'data_inicio', 'data_fim', 'testes_finais', 'observacoes_finais', 'data_conclusao', 'pecas_trocadas', 'observacoes'];
    const servico = {
      ...pick(req.body, servicoFields),
      anexos_servico: sanitizeAnexos(req.body.anexos_servico, Date.now(), ['image']),
    };
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    os.servico_executado = servico;
    if (servico.data_conclusao) os.data_conclusao = servico.data_conclusao;
    registrarEventoOS(os, req, {
      tipo: 'tecnico',
      titulo: 'Execucao salva',
      descricao: servico.descricao_servico || 'Servico executado atualizado',
      metadata: { fotos: servico.anexos_servico?.length || 0 },
    });
    await os.save();
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
exports.salvarPagamento = async (req, res) => {
  try {
    const pagamento = sanitizeNumericFields(pick(req.body, ['valor_bruto', 'desconto', 'forma_pagamento', 'status_pagamento', 'data_pagamento', 'observacoes']), ['valor_bruto', 'desconto']);
    if (!FORMAS_PAGAMENTO_VALIDAS.includes(pagamento.forma_pagamento || null)) return badRequest(res, 'Forma de pagamento invalida', ['forma_pagamento']);
    if (pagamento.status_pagamento && !STATUS_PAGAMENTO_VALIDOS.includes(pagamento.status_pagamento)) return badRequest(res, 'Status de pagamento invalido', ['status_pagamento']);
    const valor_final = Number(pagamento.valor_bruto || 0) - Number(pagamento.desconto || 0);
    if (valor_final < 0) return badRequest(res, 'Desconto nao pode ser maior que o valor bruto', ['desconto']);
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    os.pagamento = { ...pagamento, valor_final };
    registrarEventoOS(os, req, {
      tipo: 'financeiro',
      titulo: 'Pagamento registrado',
      descricao: `Pagamento ${pagamento.status_pagamento || 'pendente'} no valor de ${moeda(valor_final)}`,
      metadata: { valor_final, status_pagamento: pagamento.status_pagamento },
    });
    await os.save();
    await sincronizarPagamentoOS(req, os);
    await notificarOS(req, os, 'pagamento_registrado', { valor: moeda(valor_final) });
    await registrarAuditoria(req, { acao: 'pagamento_salvo', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Registrou pagamento da OS ${os.id_os}`, metadata: { valor_final, status_pagamento: pagamento.status_pagamento, forma_pagamento: pagamento.forma_pagamento } });
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

exports.salvarEntrega = async (req, res) => {
  try {
    const dataEntrega = req.body.data_entrega || new Date();
    const entrega = {
      recebedor_nome: req.body.recebedor_nome,
      recebedor_documento: onlyDigits(req.body.recebedor_documento),
      observacoes: req.body.observacoes,
      data_entrega: dataEntrega,
    };
    if (!entrega.recebedor_nome || entrega.recebedor_nome.trim().length < 2) return badRequest(res, 'Nome do recebedor e obrigatorio', ['recebedor_nome']);
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    os.entrega = entrega;
    os.data_entrega = dataEntrega;
    os.status = 'entregue';
    os.historico_status.push({ status: 'entregue', usuario: getUsuarioNome(req) });
    registrarEventoOS(os, req, {
      tipo: 'cliente',
      titulo: 'Entrega registrada',
      descricao: `Aparelho entregue para ${entrega.recebedor_nome}`,
      metadata: { data_entrega: dataEntrega },
    });
    await os.save();
    await notificarOS(req, os, 'entrega_registrada', { garantia: os.garantia?.fim ? formatarDataBR(os.garantia.fim) : 'nao registrada' });
    await registrarAuditoria(req, { acao: 'entrega_registrada', entidade: 'os', entidade_id: os._id, entidade_codigo: os.id_os, descricao: `Registrou entrega da OS ${os.id_os}`, metadata: { recebedor_nome: entrega.recebedor_nome, data_entrega: entrega.data_entrega } });
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

exports.salvarChecklist = async (req, res) => {
  try {
    const tipo = req.params.tipo;
    if (!['entrada', 'saida'].includes(tipo)) return badRequest(res, 'Tipo de checklist invalido', ['tipo']);
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });

    const padrao = tipo === 'entrada' ? CHECKLIST_ENTRADA_PADRAO : CHECKLIST_SAIDA_PADRAO;
    os.checklists = os.checklists || {};
    os.checklists[tipo] = normalizarChecklist(req.body.items, padrao);
    registrarEventoOS(os, req, {
      tipo: 'checklist',
      titulo: `Checklist de ${tipo} atualizado`,
      descricao: `${os.checklists[tipo].filter((item) => item.checked).length}/${os.checklists[tipo].length} itens concluídos`,
    });
    await os.save();
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

exports.salvarGarantia = async (req, res) => {
  try {
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });
    const config = await obterConfiguracao();
    const dias = Math.max(Number(req.body.dias || config.operacional?.garantia_padrao_dias || 90), 0);
    const inicio = req.body.inicio ? new Date(req.body.inicio) : new Date();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + dias);

    os.garantia = {
      ativa: Boolean(req.body.ativa ?? true),
      dias,
      inicio,
      fim,
      cobertura: req.body.cobertura || config.operacional?.cobertura_garantia || 'Garantia de servico conforme politica da empresa',
      observacoes: req.body.observacoes,
    };
    registrarEventoOS(os, req, {
      tipo: 'garantia',
      titulo: 'Garantia registrada',
      descricao: `Garantia de ${dias} dia(s) ate ${fim.toLocaleDateString('pt-BR')}`,
      metadata: { dias, fim },
    });
    await os.save();
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

exports.reabrirOS = async (req, res) => {
  try {
    const motivo = String(req.body.motivo || '').trim();
    if (motivo.length < 5) return badRequest(res, 'Informe um motivo para reabrir a OS', ['motivo']);
    const os = await OrdemServico.findById(req.params.id);
    if (!os) return res.status(404).json({ erro: 'OS não encontrada' });

    os.status = 'em_diagnostico';
    os.reaberturas = os.reaberturas || [];
    os.reaberturas.push({ motivo, usuario: getUsuarioNome(req) });
    os.historico_status.push({ status: 'em_diagnostico', usuario: getUsuarioNome(req) });
    registrarEventoOS(os, req, {
      tipo: 'garantia',
      titulo: 'OS reaberta',
      descricao: motivo,
      metadata: { status: 'em_diagnostico' },
    });
    await os.save();
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

exports.imprimirOS = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = req.query.token || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
    if (!token || !process.env.JWT_SECRET) return res.status(401).send('Nao autenticado');
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).send('Token invalido');
    }
    const os = await OrdemServico.findById(req.params.id).lean();
    if (!os) return res.status(404).send('OS nao encontrada');
    const config = await obterConfiguracao();
    const baseUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/os-publica/${os.id_os}`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(montarDocumentoOS(os, { publicUrl, config }));
  } catch (error) { res.status(500).send(error.message); }
};

exports.qrOS = async (req, res) => {
  try {
    const os = await OrdemServico.findById(req.params.id).select('id_os').lean();
    if (!os) return res.status(404).json({ erro: 'OS nao encontrada' });
    const baseUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const url = `${baseUrl.replace(/\/$/, '')}/os-publica/${os.id_os}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}`;
    res.json({ url, qrUrl });
  } catch (error) { res.status(500).json({ erro: error.message }); }
};

exports.buscarOSPublica = async (req, res) => {
  try {
    const os = await OrdemServico.findOne({ id_os: req.params.codigo })
      .select('id_os status prazo_estimado cliente.nome aparelho.tipo_aparelho aparelho.marca aparelho.modelo diagnostico.defeito_identificado orcamento.valor_total orcamento.status_aprovacao garantia.fim eventos.titulo eventos.descricao eventos.tipo eventos.data')
      .lean();
    if (!os) return res.status(404).json({ erro: 'OS nao encontrada' });
    res.json(os);
  } catch (error) { res.status(500).json({ erro: error.message }); }
};
