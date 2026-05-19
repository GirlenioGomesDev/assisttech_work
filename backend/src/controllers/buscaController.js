// Busca global usada pela barra de pesquisa do sistema.
const Cliente = require('../models/Cliente');
const OrdemServico = require('../models/OrdemServico');
const EstoqueItem = require('../models/EstoqueItem');
const onlyDigits = require('../utils/onlyDigits');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.global = async (req, res) => {
  try {
    const termo = String(req.query.q || '').trim();
    if (termo.length < 2) return res.json({ termo, resultados: [] });

    const regex = new RegExp(escapeRegex(termo), 'i');
    const digitos = onlyDigits(termo);
    const digitRegex = digitos.length >= 2 ? new RegExp(escapeRegex(digitos)) : null;

    const [clientes, ordens, estoque] = await Promise.all([
      Cliente.find({
        ativo: true,
        $or: [
          { nome: regex },
          { email: regex },
          { id_cliente: regex },
          ...(digitRegex ? [{ telefone: digitRegex }, { whatsapp: digitRegex }, { cpf: digitRegex }] : []),
        ],
      }).select('id_cliente nome telefone whatsapp email cpf').sort({ updatedAt: -1 }).limit(8).lean(),

      OrdemServico.find({
        $or: [
          { id_os: regex },
          { 'cliente.nome': regex },
          { 'cliente.telefone': digitRegex || regex },
          { 'cliente.whatsapp': digitRegex || regex },
          { 'aparelho.marca': regex },
          { 'aparelho.modelo': regex },
          { 'aparelho.imei_ou_serial': digitRegex || regex },
          { defeito_relatado: regex },
        ],
      }).select('id_os status prioridade cliente aparelho orcamento.valor_total updatedAt').sort({ updatedAt: -1 }).limit(10).lean(),

      EstoqueItem.find({
        ativo: true,
        $or: [
          { id_item: regex },
          { nome: regex },
          { categoria: regex },
          { marca: regex },
          { modelo: regex },
          { fornecedor: regex },
        ],
      }).select('id_item nome categoria marca modelo quantidade estoque_minimo').sort({ updatedAt: -1 }).limit(6).lean(),
    ]);

    const resultados = [
      ...ordens.map((os) => ({
        tipo: 'os',
        id: String(os._id),
        codigo: os.id_os,
        titulo: `${os.id_os} - ${os.cliente?.nome || 'Cliente nao informado'}`,
        subtitulo: `${os.aparelho?.marca || ''} ${os.aparelho?.modelo || ''}`.trim() || os.defeito_relatado,
        status: os.status,
        destino: `/ordem-servico/${os._id}`,
      })),
      ...clientes.map((cliente) => ({
        tipo: 'cliente',
        id: String(cliente._id),
        codigo: cliente.id_cliente,
        titulo: cliente.nome,
        subtitulo: [cliente.telefone || cliente.whatsapp, cliente.email].filter(Boolean).join(' | '),
        destino: `/historico-cliente/${cliente._id}`,
      })),
      ...estoque.map((item) => ({
        tipo: 'estoque',
        id: String(item._id),
        codigo: item.id_item,
        titulo: item.nome,
        subtitulo: [item.categoria, item.marca, item.modelo].filter(Boolean).join(' | '),
        status: `${item.quantidade || 0} em estoque`,
        destino: '/estoque',
      })),
    ];

    res.json({ termo, resultados });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
