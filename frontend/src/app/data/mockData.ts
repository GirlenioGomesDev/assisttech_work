// Dados mock para demonstração do sistema

export const mockUsers = [
  { id: '1', nome: 'João Silva', cargo: 'Administrador', login: 'joao', nivelAcesso: 'administrador' },
  { id: '2', nome: 'Maria Santos', cargo: 'Atendente', login: 'maria', nivelAcesso: 'atendente' },
  { id: '3', nome: 'Carlos Oliveira', cargo: 'Técnico', login: 'carlos', nivelAcesso: 'tecnico' },
];

export const mockClientes = [
  {
    id: '1',
    nome: 'Pedro Almeida',
    telefone: '(11) 98765-4321',
    whatsapp: '(11) 98765-4321',
    cpf: '123.456.789-00',
    email: 'pedro@email.com',
    endereco: 'Rua das Flores, 123 - São Paulo/SP',
    observacoes: 'Cliente preferencial',
  },
  {
    id: '2',
    nome: 'Ana Costa',
    telefone: '(11) 91234-5678',
    whatsapp: '(11) 91234-5678',
    cpf: '987.654.321-00',
    email: 'ana@email.com',
    endereco: 'Av. Paulista, 456 - São Paulo/SP',
    observacoes: '',
  },
  {
    id: '3',
    nome: 'Roberto Lima',
    telefone: '(11) 99999-8888',
    whatsapp: '(11) 99999-8888',
    cpf: '456.789.123-00',
    email: 'roberto@email.com',
    endereco: 'Rua Augusta, 789 - São Paulo/SP',
    observacoes: 'Ligar antes de entregar',
  },
];

export const mockAparelhos = [
  {
    id: '1',
    clienteId: '1',
    tipo: 'Celular',
    marca: 'Samsung',
    modelo: 'Galaxy S21',
    cor: 'Preto',
    imei: '123456789012345',
    acessorios: 'Carregador, Fone de ouvido',
    senha: '****',
    estadoFisico: 'Bom estado, tela trincada',
    observacoes: 'Cliente relatou que não liga',
  },
  {
    id: '2',
    clienteId: '2',
    tipo: 'Notebook',
    marca: 'Dell',
    modelo: 'Inspiron 15',
    cor: 'Prata',
    imei: 'SN987654321',
    acessorios: 'Carregador',
    senha: 'Sem senha',
    estadoFisico: 'Riscos na tampa',
    observacoes: 'Não carrega bateria',
  },
  {
    id: '3',
    clienteId: '3',
    tipo: 'Celular',
    marca: 'Apple',
    modelo: 'iPhone 12',
    cor: 'Azul',
    imei: '987654321098765',
    acessorios: 'Capinha',
    senha: '****',
    estadoFisico: 'Excelente',
    observacoes: 'Bateria viciada',
  },
];

export type StatusOS = 'aberta' | 'em_analise' | 'aguardando_aprovacao' | 'em_conserto' | 'aguardando_peca' | 'pronta' | 'entregue' | 'cancelada';

export const statusLabels: Record<StatusOS, string> = {
  aberta: 'Aberta',
  em_analise: 'Em Análise',
  aguardando_aprovacao: 'Aguardando Aprovação',
  em_conserto: 'Em Conserto',
  aguardando_peca: 'Aguardando Peça',
  pronta: 'Pronta',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

export const statusColors: Record<StatusOS, string> = {
  aberta: 'bg-blue-100 text-blue-800',
  em_analise: 'bg-purple-100 text-purple-800',
  aguardando_aprovacao: 'bg-yellow-100 text-yellow-800',
  em_conserto: 'bg-orange-100 text-orange-800',
  aguardando_peca: 'bg-pink-100 text-pink-800',
  pronta: 'bg-green-100 text-green-800',
  entregue: 'bg-gray-100 text-gray-800',
  cancelada: 'bg-red-100 text-red-800',
};

export const mockOrdensServico = [
  {
    id: 'OS-001',
    clienteId: '1',
    aparelhoId: '1',
    defeitoRelatado: 'Aparelho não liga',
    dataEntrada: '2026-03-25',
    prioridade: 'Alta',
    tecnicoId: '3',
    previsao: '2026-03-28',
    status: 'em_analise' as StatusOS,
    diagnostico: 'Bateria descarregada, possível problema na placa',
    orcamento: {
      maoDeObra: 150.00,
      pecas: 200.00,
      total: 350.00,
      dataOrcamento: '2026-03-26',
      statusAprovacao: 'aguardando',
    },
    historico: [
      { data: '2026-03-25 10:30', usuario: 'Maria Santos', descricao: 'OS aberta' },
      { data: '2026-03-26 14:00', usuario: 'Carlos Oliveira', descricao: 'Iniciada análise técnica' },
    ],
  },
  {
    id: 'OS-002',
    clienteId: '2',
    aparelhoId: '2',
    defeitoRelatado: 'Não carrega bateria',
    dataEntrada: '2026-03-26',
    prioridade: 'Média',
    tecnicoId: '3',
    previsao: '2026-03-30',
    status: 'em_conserto' as StatusOS,
    diagnostico: 'Conector de carga danificado',
    orcamento: {
      maoDeObra: 100.00,
      pecas: 80.00,
      total: 180.00,
      dataOrcamento: '2026-03-26',
      statusAprovacao: 'aprovado',
    },
    servicoRealizado: 'Troca do conector de carga',
    pecasTrocadas: 'Conector DC Jack',
    historico: [
      { data: '2026-03-26 09:00', usuario: 'Maria Santos', descricao: 'OS aberta' },
      { data: '2026-03-26 11:00', usuario: 'Carlos Oliveira', descricao: 'Diagnóstico realizado' },
      { data: '2026-03-26 15:00', usuario: 'Ana Costa', descricao: 'Orçamento aprovado pelo cliente' },
      { data: '2026-03-27 10:00', usuario: 'Carlos Oliveira', descricao: 'Iniciado reparo' },
    ],
  },
  {
    id: 'OS-003',
    clienteId: '3',
    aparelhoId: '3',
    defeitoRelatado: 'Bateria dura pouco',
    dataEntrada: '2026-03-27',
    prioridade: 'Baixa',
    tecnicoId: '3',
    previsao: '2026-04-02',
    status: 'pronta' as StatusOS,
    diagnostico: 'Bateria com degradação acima de 80%',
    orcamento: {
      maoDeObra: 80.00,
      pecas: 250.00,
      total: 330.00,
      dataOrcamento: '2026-03-27',
      statusAprovacao: 'aprovado',
    },
    servicoRealizado: 'Substituição de bateria',
    pecasTrocadas: 'Bateria original Apple',
    testesFinais: 'Bateria carregando 100%, autonomia testada',
    dataConclusao: '2026-03-28',
    historico: [
      { data: '2026-03-27 14:00', usuario: 'Maria Santos', descricao: 'OS aberta' },
      { data: '2026-03-27 16:00', usuario: 'Carlos Oliveira', descricao: 'Diagnóstico e orçamento' },
      { data: '2026-03-27 17:00', usuario: 'Roberto Lima', descricao: 'Aprovação por WhatsApp' },
      { data: '2026-03-28 11:00', usuario: 'Carlos Oliveira', descricao: 'Reparo concluído' },
    ],
  },
];

export const mockPagamentos = [
  {
    id: '1',
    osId: 'OS-003',
    valorCobrado: 330.00,
    desconto: 0,
    valorFinal: 330.00,
    formaPagamento: 'Pix',
    dataPagamento: '2026-03-28',
    statusPagamento: 'pago',
  },
];

export const dashboardStats = {
  osAbertas: 1,
  emAnalise: 1,
  emConserto: 1,
  prontas: 1,
  concluidas: 1,
  atendimentosHoje: 3,
  alertasAtraso: 0,
};
