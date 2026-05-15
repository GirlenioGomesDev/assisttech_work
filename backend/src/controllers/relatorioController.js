const OrdemServico = require('../models/OrdemServico');
const EstoqueItem = require('../models/EstoqueItem');

const periodoParaData = (periodo) => {
  const agora = new Date();
  const inicio = new Date(agora);

  if (periodo === 'hoje') inicio.setHours(0, 0, 0, 0);
  else if (periodo === 'semana') inicio.setDate(agora.getDate() - 7);
  else if (periodo === 'ano') inicio.setFullYear(agora.getFullYear() - 1);
  else inicio.setMonth(agora.getMonth() - 1);

  return inicio;
};

const sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) || 0), 0);

exports.relatorioEmpresa = async (req, res) => {
  try {
    const inicio = periodoParaData(req.query.periodo || 'mes');
    const osPeriodo = await OrdemServico.find({ createdAt: { $gte: inicio } });
    const estoque = await EstoqueItem.find({ ativo: true });

    const concluidas = osPeriodo.filter((os) => ['pronto', 'entregue'].includes(os.status));
    const entregues = osPeriodo.filter((os) => os.status === 'entregue');
    const faturamento = sum(entregues, (os) => os.pagamento?.valor_final || os.orcamento?.valor_total);
    const gastoPecas = sum(concluidas, (os) => os.orcamento?.valor_pecas);
    const maoObra = sum(concluidas, (os) => os.orcamento?.valor_mao_obra);
    const valorEstoque = sum(estoque, (item) => item.quantidade * item.valor_unitario);
    const estoqueBaixo = estoque.filter((item) => Number(item.quantidade || 0) <= Number(item.estoque_minimo || 0));
    const pecasVendidas = sum(concluidas, (os) => os.pecas_utilizadas?.reduce((total, peca) => total + Number(peca.quantidade || 0), 0));
    const lucroEstimado = faturamento - gastoPecas;
    const investimento = valorEstoque + gastoPecas;

    const porStatus = Object.values(
      osPeriodo.reduce((acc, os) => {
        const status = os.status || 'sem_status';
        acc[status] = acc[status] || { name: status, quantidade: 0 };
        acc[status].quantidade += 1;
        return acc;
      }, {})
    );

    const aparelhosMaisAtendidos = Object.values(
      osPeriodo.reduce((acc, os) => {
        const nome = `${os.aparelho?.marca || 'N/A'} ${os.aparelho?.modelo || ''}`.trim();
        acc[nome] = acc[nome] || { name: nome, quantidade: 0 };
        acc[nome].quantidade += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

    const tecnicosMaisAtendimentos = Object.values(
      osPeriodo.reduce((acc, os) => {
        const nome = os.tecnico?.nome || 'Sem técnico';
        acc[nome] = acc[nome] || { name: nome, quantidade: 0 };
        acc[nome].quantidade += 1;
        return acc;
      }, {})
    ).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

    res.json({
      periodo: req.query.periodo || 'mes',
      resumo: {
        total_servicos: osPeriodo.length,
        concertos_feitos: concluidas.length,
        entregues: entregues.length,
        pecas_vendidas: pecasVendidas,
        pecas_em_estoque: sum(estoque, (item) => item.quantidade),
        valor_em_estoque: valorEstoque,
        gasto_pecas: gastoPecas,
        faturamento,
        mao_obra: maoObra,
        lucro_estimado: lucroEstimado,
        investimento,
        estoque_baixo: estoqueBaixo.length,
      },
      graficos: {
        por_status: porStatus,
        aparelhos_mais_atendidos: aparelhosMaisAtendidos,
        tecnicos_mais_atendimentos: tecnicosMaisAtendimentos,
      },
      estoque_baixo: estoqueBaixo.map((item) => ({
        id_item: item.id_item,
        nome: item.nome,
        quantidade: item.quantidade,
        estoque_minimo: item.estoque_minimo,
      })),
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
