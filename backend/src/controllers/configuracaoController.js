// Leitura e gravacao das configuracoes gerais do sistema.
const ConfiguracaoSistema = require('../models/ConfiguracaoSistema');
const registrarAuditoria = require('../utils/auditoria');
const onlyDigits = require('../utils/onlyDigits');

const DEFAULT_CONFIG = {
  chave: 'principal',
  empresa: {
    nome: 'AssistTech',
    razao_social: '',
    documento: '',
    telefone: '',
    whatsapp: '',
    email: '',
    site: '',
    endereco: {},
    logo_base64: '',
  },
  operacional: {
    garantia_padrao_dias: 90,
    cobertura_garantia: 'Garantia de servico conforme politica da empresa',
    prazo_orcamento_horas: 24,
    horario_atendimento: '',
  },
  documentos: {
    rodape_os: 'Obrigado pela preferencia.',
    termo_garantia: 'A garantia cobre exclusivamente o servico executado e as pecas substituidas, conforme descrito nesta ordem de servico.',
    observacoes_orcamento: '',
  },
  mensagens: {
    os_criada: 'Ola, {{cliente.nome}}! Sua OS {{os.id_os}} foi aberta com sucesso.',
    orcamento_pronto: 'Ola, {{cliente.nome}}! O orcamento da OS {{os.id_os}} ficou em {{valor}}.',
    os_pronta: 'Ola, {{cliente.nome}}! Sua OS {{os.id_os}} esta pronta para retirada.',
    entrega: 'Ola, {{cliente.nome}}! A entrega da OS {{os.id_os}} foi registrada. Obrigado pela preferencia.',
  },
};

const deepMerge = (base, update) => {
  const result = { ...base };
  Object.entries(update || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] || {}, value);
    } else if (value !== undefined) {
      result[key] = value;
    }
  });
  return result;
};

const sanitizar = (body = {}) => {
  const data = deepMerge(DEFAULT_CONFIG, body);
  data.chave = 'principal';
  data.empresa.nome = String(data.empresa.nome || 'AssistTech').trim().slice(0, 120);
  data.empresa.razao_social = String(data.empresa.razao_social || '').trim().slice(0, 160);
  data.empresa.documento = onlyDigits(data.empresa.documento).slice(0, 14);
  data.empresa.telefone = onlyDigits(data.empresa.telefone).slice(0, 13);
  data.empresa.whatsapp = onlyDigits(data.empresa.whatsapp).slice(0, 13);
  data.empresa.email = String(data.empresa.email || '').trim().toLowerCase().slice(0, 160);
  data.empresa.site = String(data.empresa.site || '').trim().slice(0, 160);
  data.empresa.logo_base64 = String(data.empresa.logo_base64 || '').startsWith('data:image/')
    ? String(data.empresa.logo_base64).slice(0, 450_000)
    : '';
  data.operacional.garantia_padrao_dias = Math.max(Number(data.operacional.garantia_padrao_dias || 90), 0);
  data.operacional.prazo_orcamento_horas = Math.max(Number(data.operacional.prazo_orcamento_horas || 24), 0);
  data.operacional.cobertura_garantia = String(data.operacional.cobertura_garantia || '').trim().slice(0, 500);
  data.operacional.horario_atendimento = String(data.operacional.horario_atendimento || '').trim().slice(0, 160);
  data.documentos.rodape_os = String(data.documentos.rodape_os || '').trim().slice(0, 500);
  data.documentos.termo_garantia = String(data.documentos.termo_garantia || '').trim().slice(0, 1200);
  data.documentos.observacoes_orcamento = String(data.documentos.observacoes_orcamento || '').trim().slice(0, 800);
  Object.keys(data.mensagens).forEach((key) => {
    data.mensagens[key] = String(data.mensagens[key] || '').trim().slice(0, 800);
  });
  return data;
};

const obterConfiguracao = async () => {
  const config = await ConfiguracaoSistema.findOne({ chave: 'principal' }).lean();
  return deepMerge(DEFAULT_CONFIG, config || {});
};

exports.obterConfiguracao = obterConfiguracao;

exports.buscar = async (_req, res) => {
  try {
    res.json(await obterConfiguracao());
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.salvar = async (req, res) => {
  try {
    const atual = await obterConfiguracao();
    const dados = sanitizar(deepMerge(atual, req.body));
    const config = await ConfiguracaoSistema.findOneAndUpdate(
      { chave: 'principal' },
      dados,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    await registrarAuditoria(req, {
      acao: 'configuracao_atualizada',
      entidade: 'configuracao',
      entidade_codigo: 'principal',
      descricao: 'Atualizou configuracoes da assistencia',
    });

    res.json(config);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.publica = async (_req, res) => {
  try {
    const config = await obterConfiguracao();
    res.json({
      empresa: config.empresa,
      documentos: {
        rodape_os: config.documentos?.rodape_os,
      },
      operacional: {
        horario_atendimento: config.operacional?.horario_atendimento,
      },
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
