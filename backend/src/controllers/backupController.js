const Auditoria = require('../models/Auditoria');
// Exportacao e importacao dos dados principais do sistema.
const Cliente = require('../models/Cliente');
const ConfiguracaoSistema = require('../models/ConfiguracaoSistema');
const EstoqueItem = require('../models/EstoqueItem');
const EstoqueMovimentacao = require('../models/EstoqueMovimentacao');
const LancamentoFinanceiro = require('../models/LancamentoFinanceiro');
const Notificacao = require('../models/Notificacao');
const OrdemServico = require('../models/OrdemServico');
const Usuario = require('../models/Usuario');
const registrarAuditoria = require('../utils/auditoria');

const collections = {
  clientes: Cliente,
  ordens_servico: OrdemServico,
  estoque_itens: EstoqueItem,
  estoque_movimentacoes: EstoqueMovimentacao,
  financeiro_lancamentos: LancamentoFinanceiro,
  configuracoes: ConfiguracaoSistema,
  usuarios: Usuario,
  notificacoes: Notificacao,
  auditoria: Auditoria,
};

const publicCollections = Object.keys(collections);

const sanitizeDocs = (docs = []) => docs.map((doc) => {
  const clean = { ...doc };
  delete clean.__v;
  return clean;
});

exports.exportar = async (req, res) => {
  try {
    const data = {};
    const contagem = {};

    for (const [nome, Model] of Object.entries(collections)) {
      const docs = await Model.find().lean();
      data[nome] = sanitizeDocs(docs);
      contagem[nome] = docs.length;
    }

    const backup = {
      meta: {
        app: 'AssistTech',
        version: 1,
        exportedAt: new Date().toISOString(),
        exportedBy: req.usuario?.nome || 'Sistema',
        collections: publicCollections,
        contagem,
      },
      data,
    };

    await registrarAuditoria(req, {
      acao: 'backup_exportado',
      entidade: 'backup',
      entidade_codigo: backup.meta.exportedAt,
      descricao: 'Exportou backup completo do sistema',
      metadata: contagem,
    });

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="assisttech-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(backup);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.resumo = async (_req, res) => {
  try {
    const contagem = {};
    for (const [nome, Model] of Object.entries(collections)) {
      contagem[nome] = await Model.countDocuments();
    }
    res.json({ collections: publicCollections, contagem, gerado_em: new Date() });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.importar = async (req, res) => {
  try {
    const backup = req.body || {};
    if (backup.meta?.app !== 'AssistTech' || !backup.data || typeof backup.data !== 'object') {
      return res.status(400).json({ erro: 'Arquivo de backup invalido' });
    }

    const resultado = {};
    for (const [nome, Model] of Object.entries(collections)) {
      const docs = Array.isArray(backup.data[nome]) ? backup.data[nome] : [];
      resultado[nome] = { recebidos: docs.length, inseridos: 0, atualizados: 0, ignorados: 0 };

      for (const rawDoc of docs) {
        if (!rawDoc || !rawDoc._id) {
          resultado[nome].ignorados += 1;
          continue;
        }

        const doc = { ...rawDoc };
        delete doc.__v;
        const existing = await Model.findById(doc._id).lean();
        await Model.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true, strict: false });
        if (existing) resultado[nome].atualizados += 1;
        else resultado[nome].inseridos += 1;
      }
    }

    await registrarAuditoria(req, {
      acao: 'backup_importado',
      entidade: 'backup',
      entidade_codigo: backup.meta?.exportedAt,
      descricao: 'Importou backup em modo mesclar',
      metadata: resultado,
    });

    res.json({ mensagem: 'Backup importado com sucesso', resultado });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
