const OrdemServico = require('../models/OrdemServico');
const EstoqueItem = require('../models/EstoqueItem');
const LancamentoFinanceiro = require('../models/LancamentoFinanceiro');

const inicioPeriodo = (periodo = 'mes') => {
  const agora = new Date();
  const inicio = new Date(agora);
  if (periodo === 'hoje') inicio.setHours(0, 0, 0, 0);
  else if (periodo === 'semana') inicio.setDate(agora.getDate() - 7);
  else if (periodo === 'ano') inicio.setFullYear(agora.getFullYear() - 1);
  else inicio.setMonth(agora.getMonth() - 1);
  return inicio;
};

const sum = (items, selector) => items.reduce((total, item) => total + Number(selector(item) || 0), 0);
const mediaHoras = (items) => {
  const concluidas = items.filter((os) => os.createdAt && (os.data_entrega || os.data_conclusao));
  if (!concluidas.length) return 0;
  const totalHoras = concluidas.reduce((total, os) => {
    const inicio = new Date(os.createdAt).getTime();
    const fim = new Date(os.data_entrega || os.data_conclusao).getTime();
    return Number.isFinite(inicio) && Number.isFinite(fim) ? total + Math.max((fim - inicio) / 36e5, 0) : total;
  }, 0);
  return Math.round(totalHoras / concluidas.length);
};

exports.executivo = async (req, res) => {
  try {
    const periodo = req.query.periodo || 'mes';
    const inicio = inicioPeriodo(periodo);
    const agora = new Date();

    const [ordens, estoque, lancamentos] = await Promise.all([
      OrdemServico.find({ createdAt: { $gte: inicio } }).sort({ createdAt: -1 }).lean(),
      EstoqueItem.find({ ativo: true }).sort({ nome: 1 }).lean(),
      LancamentoFinanceiro.find({ ativo: true, createdAt: { $gte: inicio } }).lean(),
    ]);

    const ativas = ordens.filter((os) => !['entregue', 'cancelada'].includes(os.status));
    const atrasadas = ativas.filter((os) => os.prazo_estimado && new Date(os.prazo_estimado) < agora);
    const prontas = ordens.filter((os) => os.status === 'pronto');
    const entregues = ordens.filter((os) => os.status === 'entregue');
    const aguardandoAprovacao = ordens.filter((os) => os.status === 'aguardando_aprovacao');
    const receitas = lancamentos.filter((item) => item.tipo === 'receita');
    const despesas = lancamentos.filter((item) => item.tipo === 'despesa');
    const receitasRecebidas = sum(receitas.filter((item) => item.status === 'pago'), (item) => item.valor);
    const despesasPagas = sum(despesas.filter((item) => item.status === 'pago'), (item) => item.valor);
    const estoqueBaixo = estoque.filter((item) => Number(item.quantidade || 0) <= Number(item.estoque_minimo || 0));
    const valorEstoque = sum(estoque, (item) => Number(item.quantidade || 0) * Number(item.custo_medio || item.valor_unitario || 0));

    const porStatus = Object.values(ordens.reduce((acc, os) => {
      const status = os.status || 'sem_status';
      acc[status] = acc[status] || { name: status, quantidade: 0 };
      acc[status].quantidade += 1;
      return acc;
    }, {}));

    const tecnicos = Object.values(ordens.reduce((acc, os) => {
      const nome = os.tecnico?.nome || 'Sem tecnico';
      acc[nome] = acc[nome] || { name: nome, quantidade: 0, entregues: 0, faturamento: 0 };
      acc[nome].quantidade += 1;
      if (os.status === 'entregue') acc[nome].entregues += 1;
      acc[nome].faturamento += Number(os.pagamento?.valor_final || os.orcamento?.valor_total || 0);
      return acc;
    }, {})).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

    const pecasMaisUsadas = Object.values(ordens.reduce((acc, os) => {
      (os.pecas_utilizadas || []).forEach((peca) => {
        const nome = peca.nome_peca || 'Peca sem nome';
        acc[nome] = acc[nome] || { name: nome, quantidade: 0, valor: 0 };
        acc[nome].quantidade += Number(peca.quantidade || 0);
        acc[nome].valor += Number(peca.quantidade || 0) * Number(peca.valor_unitario || 0);
      });
      return acc;
    }, {})).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);

    const alertas = [
      ...atrasadas.slice(0, 5).map((os) => ({ tipo: 'atraso', titulo: `OS ${os.id_os} atrasada`, descricao: os.cliente?.nome || 'Cliente nao informado', id: os._id })),
      ...estoqueBaixo.slice(0, 5).map((item) => ({ tipo: 'estoque', titulo: `${item.nome} em baixo estoque`, descricao: `${item.quantidade} / minimo ${item.estoque_minimo}`, id: item._id })),
      ...aguardandoAprovacao.slice(0, 5).map((os) => ({ tipo: 'aprovacao', titulo: `OS ${os.id_os} aguardando aprovacao`, descricao: os.cliente?.nome || 'Cliente nao informado', id: os._id })),
    ].slice(0, 10);

    res.json({
      periodo,
      resumo: {
        total_os: ordens.length,
        os_ativas: ativas.length,
        os_atrasadas: atrasadas.length,
        os_prontas: prontas.length,
        os_entregues: entregues.length,
        aguardando_aprovacao: aguardandoAprovacao.length,
        faturamento: receitasRecebidas,
        despesas: despesasPagas,
        lucro: receitasRecebidas - despesasPagas,
        ticket_medio: entregues.length ? receitasRecebidas / entregues.length : 0,
        tempo_medio_reparo_horas: mediaHoras(entregues),
        estoque_baixo: estoqueBaixo.length,
        valor_estoque: valorEstoque,
      },
      graficos: { por_status: porStatus },
      rankings: { tecnicos, pecas_mais_usadas: pecasMaisUsadas },
      alertas,
      listas: {
        os_ativas: ativas.slice(0, 8),
        os_atrasadas: atrasadas.slice(0, 8),
        estoque_baixo: estoqueBaixo.slice(0, 8),
      },
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
