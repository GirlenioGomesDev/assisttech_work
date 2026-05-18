require('dotenv').config();
const bcrypt = require('bcryptjs');
const conectarDB = require('../config/db');
const Auditoria = require('../models/Auditoria');
const Cliente = require('../models/Cliente');
const ConfiguracaoSistema = require('../models/ConfiguracaoSistema');
const EstoqueItem = require('../models/EstoqueItem');
const EstoqueMovimentacao = require('../models/EstoqueMovimentacao');
const LancamentoFinanceiro = require('../models/LancamentoFinanceiro');
const Notificacao = require('../models/Notificacao');
const OrdemServico = require('../models/OrdemServico');
const Usuario = require('../models/Usuario');
const ensureAdmin = require('../utils/ensureAdmin');

const now = new Date();
const diasAtras = (dias) => new Date(now.getTime() - dias * 24 * 60 * 60 * 1000);
const diasFrente = (dias) => new Date(now.getTime() + dias * 24 * 60 * 60 * 1000);
const competencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const userSnapshot = { id: 'DEMO-SEED', nome: 'Carga demonstrativa' };

async function limparDemo() {
  await Promise.all([
    Cliente.deleteMany({ id_cliente: /^CLI-DEMO-/ }),
    Usuario.deleteMany({ login: /^demo\./ }),
    EstoqueMovimentacao.deleteMany({ id_movimentacao: /^MOV-DEMO-/ }),
    EstoqueItem.deleteMany({ id_item: /^EST-DEMO-/ }),
    LancamentoFinanceiro.deleteMany({ id_lancamento: /^FIN-DEMO-/ }),
    Notificacao.deleteMany({ id_notificacao: /^NOT-DEMO-/ }),
    OrdemServico.deleteMany({ id_os: /^OS-DEMO-/ }),
    Auditoria.deleteMany({ entidade_codigo: /^DEMO-/ }),
  ]);
}

async function criarConfiguracao() {
  await ConfiguracaoSistema.findOneAndUpdate(
    { chave: 'principal' },
    {
      chave: 'principal',
      empresa: {
        nome: 'TechPrime Assistencia',
        razao_social: 'TechPrime Assistencia Tecnica LTDA',
        documento: '47815962000190',
        telefone: '11940028990',
        whatsapp: '11940028990',
        email: 'atendimento@techprimeassistencia.com.br',
        site: 'https://techprimeassistencia.com.br',
        endereco: {
          logradouro: 'Rua das Oficinas',
          numero: '128',
          bairro: 'Centro',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '01001000',
          complemento: 'Loja 4',
        },
      },
      operacional: {
        garantia_padrao_dias: 90,
        cobertura_garantia: 'Garantia de 90 dias para o servico executado e pecas substituidas, exceto mau uso, queda, umidade ou violacao do lacre.',
        prazo_orcamento_horas: 24,
        horario_atendimento: 'Segunda a sexta, 08h as 18h; sabado, 09h as 13h',
      },
      documentos: {
        rodape_os: 'TechPrime Assistencia - Atendimento com diagnostico transparente, pecas testadas e garantia registrada.',
        termo_garantia: 'A garantia cobre apenas o defeito reparado nesta OS. Perde a validade em caso de queda, contato com liquido, violacao de lacres, tentativa de reparo por terceiros ou dano diferente do relatado.',
        observacoes_orcamento: 'Orcamento valido por 7 dias. Aprovacao do cliente e obrigatoria antes da execucao do reparo.',
      },
      mensagens: {
        os_criada: 'Ola, {{cliente.nome}}! Sua OS {{os.id_os}} foi aberta na TechPrime. Vamos analisar o aparelho {{aparelho}} e avisaremos cada etapa.',
        orcamento_pronto: 'Ola, {{cliente.nome}}! O orcamento da OS {{os.id_os}} ficou em {{valor}}. Responda para aprovarmos o reparo.',
        os_pronta: 'Ola, {{cliente.nome}}! Sua OS {{os.id_os}} esta pronta para retirada na TechPrime.',
        entrega: 'Ola, {{cliente.nome}}! A entrega da OS {{os.id_os}} foi registrada. Obrigado por escolher a TechPrime.',
      },
    },
    { upsert: true, new: true }
  );
}

async function criarUsuarios() {
  const senha_hash = await bcrypt.hash('admin123', 10);
  const usuarios = [
    ['USR-DEMO-001', 'Marina Alves', 'demo.atendente', 'marina.atendimento@techprime.com', 'atendente'],
    ['USR-DEMO-002', 'Rafael Moreira', 'demo.tecnico1', 'rafael.tecnico@techprime.com', 'tecnico'],
    ['USR-DEMO-003', 'Camila Rocha', 'demo.tecnico2', 'camila.tecnico@techprime.com', 'tecnico'],
    ['USR-DEMO-004', 'Bruno Ferreira', 'demo.financeiro', 'bruno.financeiro@techprime.com', 'financeiro'],
  ];

  await Usuario.insertMany(usuarios.map(([id_usuario, nome, login, email, perfil]) => ({
    id_usuario,
    nome,
    login,
    email,
    perfil,
    perfis: [perfil],
    ativo: true,
    senha_hash,
  })));

  return Usuario.find({ id_usuario: /^USR-DEMO-/ }).lean();
}

async function criarClientes() {
  const clientes = [
    {
      id_cliente: 'CLI-DEMO-001',
      nome: 'Ana Carolina Martins',
      telefone: '11987654321',
      whatsapp: '11987654321',
      cpf: '12345678901',
      email: 'ana.martins@email.com',
      endereco: { rua: 'Rua Bela Vista', numero: '84', bairro: 'Vila Mariana', cidade: 'Sao Paulo', estado: 'SP', cep: '04101000' },
      observacoes: 'Cliente recorrente. Prefere contato por WhatsApp no periodo da tarde.',
    },
    {
      id_cliente: 'CLI-DEMO-002',
      nome: 'Joao Pedro Almeida',
      telefone: '11976543210',
      whatsapp: '11976543210',
      cpf: '98765432100',
      email: 'joao.almeida@email.com',
      endereco: { rua: 'Av. Paulista', numero: '1578', bairro: 'Bela Vista', cidade: 'Sao Paulo', estado: 'SP', cep: '01310200' },
      observacoes: 'Solicita nota e recibo para reembolso corporativo.',
    },
    {
      id_cliente: 'CLI-DEMO-003',
      nome: 'Patricia Nogueira',
      telefone: '11988887777',
      whatsapp: '11988887777',
      cpf: '32165498709',
      email: 'patricia.nogueira@email.com',
      endereco: { rua: 'Rua Augusta', numero: '900', bairro: 'Consolacao', cidade: 'Sao Paulo', estado: 'SP', cep: '01305000' },
      observacoes: 'Cliente pediu prioridade por usar notebook para trabalho remoto.',
    },
    {
      id_cliente: 'CLI-DEMO-004',
      nome: 'Lucas Henrique Souza',
      telefone: '11970001122',
      whatsapp: '11970001122',
      cpf: '45678912300',
      email: 'lucas.souza@email.com',
      endereco: { rua: 'Rua Vergueiro', numero: '2100', bairro: 'Ipiranga', cidade: 'Sao Paulo', estado: 'SP', cep: '04273000' },
      observacoes: 'Trouxe aparelho com sinais de queda e pelicula quebrada.',
    },
    {
      id_cliente: 'CLI-DEMO-005',
      nome: 'Fernanda Lima Costa',
      telefone: '11961112233',
      whatsapp: '11961112233',
      cpf: '65498732111',
      email: 'fernanda.costa@email.com',
      endereco: { rua: 'Rua Turiassu', numero: '450', bairro: 'Perdizes', cidade: 'Sao Paulo', estado: 'SP', cep: '05005000' },
      observacoes: 'Autorizou troca se o valor total ficar abaixo de R$ 450,00.',
    },
    {
      id_cliente: 'CLI-DEMO-006',
      nome: 'Renato Carvalho',
      telefone: '11995556677',
      whatsapp: '11995556677',
      cpf: '14725836900',
      email: 'renato.carvalho@email.com',
      endereco: { rua: 'Rua Clodomiro Amazonas', numero: '72', bairro: 'Itaim Bibi', cidade: 'Sao Paulo', estado: 'SP', cep: '04537000' },
      observacoes: 'Cliente em garantia. Solicita retorno tecnico detalhado.',
    },
  ];

  await Cliente.insertMany(clientes);
  return Cliente.find({ id_cliente: /^CLI-DEMO-/ }).lean();
}

async function criarEstoque() {
  const itens = [
    ['EST-DEMO-001', 'Tela iPhone 11 Premium', 'Tela', 'Apple', 'iPhone 11', 6, 2, 380, 310, 'Prime Parts'],
    ['EST-DEMO-002', 'Bateria Samsung A32', 'Bateria', 'Samsung', 'A32', 4, 2, 160, 118, 'Mobile Center'],
    ['EST-DEMO-003', 'Conector de carga Moto G60', 'Conector', 'Motorola', 'G60', 2, 3, 95, 62, 'Tecno Distribuidora'],
    ['EST-DEMO-004', 'SSD Kingston 480GB', 'Armazenamento', 'Kingston', 'A400', 8, 3, 280, 215, 'InfoParts'],
    ['EST-DEMO-005', 'Memoria DDR4 Notebook 8GB', 'Memoria', 'Crucial', 'DDR4 2666', 5, 2, 190, 145, 'InfoParts'],
    ['EST-DEMO-006', 'Teclado Dell Inspiron 15', 'Teclado', 'Dell', 'Inspiron 15', 1, 2, 220, 170, 'NoteFix'],
    ['EST-DEMO-007', 'Fonte Notebook Universal 90W', 'Fonte', 'Multilaser', '90W', 7, 2, 140, 95, 'NoteFix'],
    ['EST-DEMO-008', 'Pelicula 3D iPhone 12', 'Acessorio', 'Apple', 'iPhone 12', 14, 5, 35, 12, 'Prime Parts'],
    ['EST-DEMO-009', 'Cooler Lenovo Ideapad', 'Refrigeracao', 'Lenovo', 'Ideapad 320', 2, 2, 130, 88, 'NoteFix'],
    ['EST-DEMO-010', 'Cabo flat Samsung A20', 'Flex', 'Samsung', 'A20', 1, 3, 70, 38, 'Mobile Center'],
  ];

  const docs = itens.map(([id_item, nome, categoria, marca, modelo, quantidade, estoque_minimo, valor_unitario, custo_medio, fornecedor]) => ({
    id_item,
    nome,
    categoria,
    marca,
    modelo,
    quantidade,
    estoque_minimo,
    valor_unitario,
    custo_medio,
    ultima_movimentacao: diasAtras(2),
    fornecedor,
    observacoes: 'Item demonstrativo para testes de estoque e baixa por OS.',
    ativo: true,
  }));

  const criados = await EstoqueItem.insertMany(docs);
  await EstoqueMovimentacao.insertMany(criados.map((item, index) => ({
    id_movimentacao: `MOV-DEMO-${String(index + 1).padStart(3, '0')}`,
    item: item._id,
    id_item: item.id_item,
    nome_item: item.nome,
    tipo: 'entrada',
    quantidade: item.quantidade,
    quantidade_anterior: 0,
    quantidade_atual: item.quantidade,
    custo_unitario: item.custo_medio,
    origem: 'compra',
    observacao: 'Entrada inicial da carga demonstrativa',
    usuario: userSnapshot,
  })));

  return EstoqueItem.find({ id_item: /^EST-DEMO-/ }).lean();
}

function montarOS({ numero, cliente, tecnico, aparelho, status, prioridade, defeito, diagnostico, orcamento, pagamento, dias, prazo, pecas = [], entrega }) {
  const criadaEm = diasAtras(dias);
  const eventos = [
    { tipo: 'sistema', titulo: 'OS aberta', descricao: `Ordem criada para ${cliente.nome}`, usuario: 'Marina Alves', data: criadaEm },
    ...(diagnostico ? [{ tipo: 'tecnico', titulo: 'Diagnostico salvo', descricao: diagnostico.defeito_identificado, usuario: tecnico.nome, data: diasAtras(Math.max(dias - 1, 0)) }] : []),
    ...(orcamento ? [{ tipo: 'financeiro', titulo: 'Orcamento registrado', descricao: `Total de R$ ${orcamento.valor_total.toFixed(2)}`, usuario: 'Bruno Ferreira', data: diasAtras(Math.max(dias - 2, 0)) }] : []),
    ...(status === 'pronto' ? [{ tipo: 'status', titulo: 'OS pronta', descricao: 'Aparelho pronto para retirada', usuario: tecnico.nome, data: diasAtras(1) }] : []),
    ...(status === 'entregue' ? [{ tipo: 'cliente', titulo: 'Entrega registrada', descricao: `Entregue para ${cliente.nome}`, usuario: 'Marina Alves', data: diasAtras(0) }] : []),
  ];

  return {
    id_os: `OS-DEMO-${String(numero).padStart(3, '0')}`,
    numero_os: 9000 + numero,
    cliente: {
      id_cliente: cliente.id_cliente,
      nome: cliente.nome,
      telefone: cliente.telefone,
      whatsapp: cliente.whatsapp,
    },
    tecnico: {
      id_usuario: tecnico.id_usuario,
      nome: tecnico.nome,
    },
    aparelho: {
      id_aparelho: `APR-DEMO-${String(numero).padStart(3, '0')}`,
      ...aparelho,
      data_cadastro: criadaEm,
    },
    data_entrada: criadaEm,
    defeito_relatado: defeito,
    diagnostico_resumido: diagnostico?.defeito_identificado,
    status,
    prioridade,
    prazo_estimado: diasFrente(prazo),
    observacoes_gerais: 'OS demonstrativa criada para testar fluxo completo do sistema.',
    diagnostico,
    orcamento,
    pecas_utilizadas: pecas,
    pagamento,
    entrega,
    data_conclusao: status === 'pronto' || status === 'entregue' ? diasAtras(1) : undefined,
    data_entrega: status === 'entregue' ? diasAtras(0) : undefined,
    checklists: {
      entrada: [
        { chave: 'fotos_entrada', label: 'Fotos do aparelho registradas', checked: true, observacao: 'Fotos demonstrativas nao anexadas' },
        { chave: 'imei_serial', label: 'IMEI ou serial conferido', checked: true },
        { chave: 'acessorios', label: 'Acessorios conferidos', checked: true },
        { chave: 'estado_fisico', label: 'Estado fisico documentado', checked: true },
      ],
      saida: [
        { chave: 'testes_finais', label: 'Testes finais realizados', checked: ['pronto', 'entregue'].includes(status) },
        { chave: 'limpeza', label: 'Aparelho limpo e revisado', checked: ['pronto', 'entregue'].includes(status) },
        { chave: 'pagamento', label: 'Pagamento conferido', checked: status === 'entregue' },
        { chave: 'garantia', label: 'Garantia explicada ao cliente', checked: status === 'entregue' },
      ],
    },
    garantia: status === 'entregue' ? {
      ativa: true,
      dias: 90,
      inicio: diasAtras(0),
      fim: diasFrente(90),
      cobertura: 'Garantia de 90 dias para o reparo demonstrativo.',
      observacoes: 'Garantia cadastrada automaticamente na carga demo.',
    } : undefined,
    eventos,
    historico_status: eventos.map((evento) => ({ status: evento.titulo, usuario: evento.usuario, data: evento.data })),
    logs: eventos.map((evento) => ({ acao: evento.titulo, usuario: evento.usuario, data: evento.data })),
    createdAt: criadaEm,
    updatedAt: diasAtras(0),
  };
}

async function criarOrdens(clientes, usuarios) {
  const tecnico1 = usuarios.find((u) => u.login === 'demo.tecnico1');
  const tecnico2 = usuarios.find((u) => u.login === 'demo.tecnico2');

  const ordens = [
    montarOS({
      numero: 1,
      cliente: clientes[0],
      tecnico: tecnico1,
      aparelho: { tipo_aparelho: 'celular', marca: 'Apple', modelo: 'iPhone 11', cor: 'Preto', imei_ou_serial: '356789112233445', acessorios_entregues: ['capinha'], estado_fisico: 'Tela trincada e tampa traseira com riscos leves' },
      status: 'aguardando_aprovacao',
      prioridade: 'alta',
      defeito: 'Tela quebrada apos queda. Touch responde parcialmente.',
      diagnostico: { defeito_identificado: 'Display danificado com falha no touch', testes_realizados: ['teste de imagem', 'teste de touch'], causa_provavel: 'Impacto fisico', solucao_recomendada: 'Troca do modulo de tela', pecas_necessarias: ['Tela iPhone 11 Premium'], observacoes_tecnicas: 'Face ID preservado' },
      orcamento: { valor_mao_obra: 120, valor_pecas: 380, valor_total: 500, status_aprovacao: 'pendente', data_orcamento: diasAtras(1) },
      dias: 3,
      prazo: 1,
      pecas: [{ id_peca: 'EST-DEMO-001', nome_peca: 'Tela iPhone 11 Premium', tipo_peca: 'Tela', marca_peca: 'Apple', quantidade: 1, valor_unitario: 380 }],
    }),
    montarOS({
      numero: 2,
      cliente: clientes[1],
      tecnico: tecnico2,
      aparelho: { tipo_aparelho: 'notebook', marca: 'Dell', modelo: 'Inspiron 15', cor: 'Prata', imei_ou_serial: 'DLINSP152023', acessorios_entregues: ['fonte original'], estado_fisico: 'Carcaca em bom estado' },
      status: 'em_reparo',
      prioridade: 'media',
      defeito: 'Notebook lento e travando ao abrir programas.',
      diagnostico: { defeito_identificado: 'HD com setores defeituosos e sistema corrompido', testes_realizados: ['SMART', 'memoria', 'stress CPU'], causa_provavel: 'Desgaste do HD', solucao_recomendada: 'Troca por SSD e reinstalacao do sistema', pecas_necessarias: ['SSD Kingston 480GB'], observacoes_tecnicas: 'Backup de dados solicitado pelo cliente' },
      orcamento: { valor_mao_obra: 180, valor_pecas: 280, valor_total: 460, status_aprovacao: 'aprovado', data_orcamento: diasAtras(4), data_aprovacao: diasAtras(3), observacao_aprovacao: 'Aprovado por WhatsApp' },
      dias: 6,
      prazo: 2,
      pecas: [{ id_peca: 'EST-DEMO-004', nome_peca: 'SSD Kingston 480GB', tipo_peca: 'Armazenamento', marca_peca: 'Kingston', quantidade: 1, valor_unitario: 280 }],
    }),
    montarOS({
      numero: 3,
      cliente: clientes[2],
      tecnico: tecnico1,
      aparelho: { tipo_aparelho: 'notebook', marca: 'Lenovo', modelo: 'Ideapad 320', cor: 'Cinza', imei_ou_serial: 'LN3209981', acessorios_entregues: ['fonte'], estado_fisico: 'Marcas leves de uso' },
      status: 'pronto',
      prioridade: 'urgente',
      defeito: 'Notebook desligando depois de alguns minutos.',
      diagnostico: { defeito_identificado: 'Cooler travado e pasta termica ressecada', testes_realizados: ['temperatura', 'stress CPU'], causa_provavel: 'Superaquecimento', solucao_recomendada: 'Troca do cooler e limpeza interna', pecas_necessarias: ['Cooler Lenovo Ideapad'], observacoes_tecnicas: 'Temperatura normalizada apos reparo' },
      orcamento: { valor_mao_obra: 160, valor_pecas: 130, valor_total: 290, status_aprovacao: 'aprovado', data_orcamento: diasAtras(5), data_aprovacao: diasAtras(5) },
      pagamento: { valor_bruto: 290, desconto: 0, valor_final: 290, forma_pagamento: 'pix', status_pagamento: 'pago', data_pagamento: diasAtras(1), observacoes: 'Pagamento antecipado via PIX' },
      dias: 7,
      prazo: -1,
      pecas: [{ id_peca: 'EST-DEMO-009', nome_peca: 'Cooler Lenovo Ideapad', tipo_peca: 'Refrigeracao', marca_peca: 'Lenovo', quantidade: 1, valor_unitario: 130 }],
    }),
    montarOS({
      numero: 4,
      cliente: clientes[3],
      tecnico: tecnico2,
      aparelho: { tipo_aparelho: 'celular', marca: 'Samsung', modelo: 'Galaxy A32', cor: 'Azul', imei_ou_serial: '359999888877776', acessorios_entregues: ['sem acessorios'], estado_fisico: 'Tela sem marcas, tampa com riscos' },
      status: 'entregue',
      prioridade: 'media',
      defeito: 'Bateria descarregando muito rapido.',
      diagnostico: { defeito_identificado: 'Bateria com baixa capacidade', testes_realizados: ['ciclo de carga', 'consumo em standby'], causa_provavel: 'Desgaste natural', solucao_recomendada: 'Troca de bateria', pecas_necessarias: ['Bateria Samsung A32'], observacoes_tecnicas: 'Teste final aprovado' },
      orcamento: { valor_mao_obra: 90, valor_pecas: 160, valor_total: 250, status_aprovacao: 'aprovado', data_orcamento: diasAtras(9), data_aprovacao: diasAtras(8) },
      pagamento: { valor_bruto: 250, desconto: 20, valor_final: 230, forma_pagamento: 'cartao_debito', status_pagamento: 'pago', data_pagamento: diasAtras(2), observacoes: 'Desconto fidelidade' },
      entrega: { data_entrega: diasAtras(1), recebedor_nome: 'Lucas Henrique Souza', recebedor_documento: '45678912300', observacoes: 'Cliente testou aparelho no balcao' },
      dias: 10,
      prazo: -2,
      pecas: [{ id_peca: 'EST-DEMO-002', nome_peca: 'Bateria Samsung A32', tipo_peca: 'Bateria', marca_peca: 'Samsung', quantidade: 1, valor_unitario: 160 }],
    }),
    montarOS({
      numero: 5,
      cliente: clientes[4],
      tecnico: tecnico1,
      aparelho: { tipo_aparelho: 'celular', marca: 'Motorola', modelo: 'Moto G60', cor: 'Verde', imei_ou_serial: '358181818181818', acessorios_entregues: ['capinha'], estado_fisico: 'Conector com folga visivel' },
      status: 'aguardando_peca',
      prioridade: 'baixa',
      defeito: 'Aparelho nao carrega em alguns cabos.',
      diagnostico: { defeito_identificado: 'Conector de carga oxidado', testes_realizados: ['teste com fonte bancada', 'teste de cabo'], causa_provavel: 'Oxidacao por umidade', solucao_recomendada: 'Troca do conector de carga', pecas_necessarias: ['Conector de carga Moto G60'], observacoes_tecnicas: 'Aguardando reposicao de fornecedor' },
      orcamento: { valor_mao_obra: 110, valor_pecas: 95, valor_total: 205, status_aprovacao: 'aprovado', data_orcamento: diasAtras(2), data_aprovacao: diasAtras(1) },
      dias: 4,
      prazo: 4,
      pecas: [{ id_peca: 'EST-DEMO-003', nome_peca: 'Conector de carga Moto G60', tipo_peca: 'Conector', marca_peca: 'Motorola', quantidade: 1, valor_unitario: 95 }],
    }),
    montarOS({
      numero: 6,
      cliente: clientes[5],
      tecnico: tecnico2,
      aparelho: { tipo_aparelho: 'notebook', marca: 'Acer', modelo: 'Aspire 5', cor: 'Prata', imei_ou_serial: 'ACASP5DEMO', acessorios_entregues: ['fonte paralela'], estado_fisico: 'Dobradiça esquerda com folga' },
      status: 'em_diagnostico',
      prioridade: 'alta',
      defeito: 'Notebook nao liga apos queda da mesa.',
      diagnostico: { defeito_identificado: 'Em analise de placa e alimentacao', testes_realizados: ['inspecao visual', 'fonte bancada'], causa_provavel: 'Possivel curto na entrada de energia', solucao_recomendada: 'Aguardar diagnostico completo', pecas_necessarias: [], observacoes_tecnicas: 'Sem autorizacao para reparo ainda' },
      dias: 1,
      prazo: 1,
    }),
    montarOS({
      numero: 7,
      cliente: clientes[0],
      tecnico: tecnico1,
      aparelho: { tipo_aparelho: 'celular', marca: 'Apple', modelo: 'iPhone 12', cor: 'Branco', imei_ou_serial: '351212121212121', acessorios_entregues: ['sem acessorios'], estado_fisico: 'Aparelho em bom estado' },
      status: 'aberta',
      prioridade: 'media',
      defeito: 'Cliente solicita aplicacao de pelicula e limpeza de alto-falante.',
      dias: 0,
      prazo: 2,
    }),
    montarOS({
      numero: 8,
      cliente: clientes[1],
      tecnico: tecnico2,
      aparelho: { tipo_aparelho: 'celular', marca: 'Samsung', modelo: 'A20', cor: 'Preto', imei_ou_serial: '352020202020202', acessorios_entregues: ['capinha', 'chip removido'], estado_fisico: 'Tela trincada, tampa descolando' },
      status: 'cancelada',
      prioridade: 'baixa',
      defeito: 'Tela nao acende.',
      diagnostico: { defeito_identificado: 'Display e cabo flat danificados', testes_realizados: ['teste com display externo'], causa_provavel: 'Impacto fisico', solucao_recomendada: 'Troca de display e cabo flat', pecas_necessarias: ['Cabo flat Samsung A20'], observacoes_tecnicas: 'Cliente nao aprovou orcamento' },
      orcamento: { valor_mao_obra: 130, valor_pecas: 70, valor_total: 200, status_aprovacao: 'rejeitado', data_orcamento: diasAtras(12), data_aprovacao: diasAtras(11), observacao_aprovacao: 'Cliente optou por nao reparar' },
      dias: 14,
      prazo: -10,
    }),
  ];

  await OrdemServico.insertMany(ordens);
  return OrdemServico.find({ id_os: /^OS-DEMO-/ }).lean();
}

async function criarFinanceiro(ordens) {
  const receitas = ordens
    .filter((os) => os.pagamento?.valor_final)
    .map((os, index) => ({
      id_lancamento: `FIN-DEMO-REC-${String(index + 1).padStart(3, '0')}`,
      tipo: 'receita',
      categoria: 'Servicos de assistencia',
      descricao: `Receita da ${os.id_os} - ${os.cliente.nome}`,
      valor: os.pagamento.valor_final,
      status: os.pagamento.status_pagamento || 'pago',
      forma_pagamento: os.pagamento.forma_pagamento,
      vencimento: os.pagamento.data_pagamento || now,
      data_pagamento: os.pagamento.data_pagamento || now,
      competencia,
      origem: 'os',
      os_id: String(os._id),
      os_codigo: os.id_os,
      cliente: os.cliente,
      observacoes: 'Lancamento demonstrativo gerado a partir de OS',
      usuario: userSnapshot,
      ativo: true,
    }));

  const despesas = [
    ['FIN-DEMO-DES-001', 'Compra de pecas', 'Pedido Prime Parts - telas e peliculas', 1840, 'pago', 'transferencia'],
    ['FIN-DEMO-DES-002', 'Aluguel', 'Aluguel da loja', 2200, 'pago', 'boleto'],
    ['FIN-DEMO-DES-003', 'Ferramentas', 'Estacao de solda e insumos', 690, 'pendente', 'boleto'],
    ['FIN-DEMO-DES-004', 'Marketing', 'Campanha local Google/Instagram', 350, 'pago', 'cartao_credito'],
  ].map(([id_lancamento, categoria, descricao, valor, status, forma_pagamento], index) => ({
    id_lancamento,
    tipo: 'despesa',
    categoria,
    descricao,
    valor,
    status,
    forma_pagamento,
    vencimento: diasAtras(index + 1),
    data_pagamento: status === 'pago' ? diasAtras(index + 1) : undefined,
    competencia,
    origem: 'manual',
    observacoes: 'Despesa demonstrativa para fluxo de caixa',
    usuario: userSnapshot,
    ativo: true,
  }));

  await LancamentoFinanceiro.insertMany([...receitas, ...despesas]);
}

async function criarNotificacoes(ordens) {
  const docs = ordens.slice(0, 6).map((os, index) => ({
    id_notificacao: `NOT-DEMO-${String(index + 1).padStart(3, '0')}`,
    canal: index % 2 === 0 ? 'whatsapp' : 'email',
    tipo: index % 2 === 0 ? 'status_atualizado' : 'orcamento_salvo',
    status: index < 3 ? 'enviado' : 'pendente',
    destinatario: {
      nome: os.cliente.nome,
      telefone: os.cliente.whatsapp || os.cliente.telefone,
      email: `${os.cliente.nome.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      id_cliente: os.cliente.id_cliente,
    },
    assunto: `Atualizacao da ${os.id_os}`,
    mensagem: `Ola, ${os.cliente.nome}! Esta e uma notificacao demonstrativa sobre a ${os.id_os}. Status atual: ${os.status}.`,
    entidade: 'os',
    entidade_id: String(os._id),
    entidade_codigo: os.id_os,
    enviado_em: index < 3 ? diasAtras(index) : undefined,
    tentativas: index < 3 ? 1 : 0,
    metadata: { demo: true, status: os.status },
    criado_por: userSnapshot,
  }));

  await Notificacao.insertMany(docs);
}

async function criarAuditoria(ordens) {
  const docs = [
    { acao: 'demo_seed', entidade: 'sistema', entidade_codigo: 'DEMO-SEED', descricao: 'Carga demonstrativa criada para testes completos do sistema' },
    ...ordens.slice(0, 5).map((os) => ({
      acao: 'os_demo_criada',
      entidade: 'os',
      entidade_id: String(os._id),
      entidade_codigo: `DEMO-${os.id_os}`,
      descricao: `OS demonstrativa ${os.id_os} criada para ${os.cliente.nome}`,
      metadata: { status: os.status },
    })),
  ].map((item) => ({
    ...item,
    usuario: { id: 'DEMO-SEED', nome: 'Carga demonstrativa', perfis: ['admin'] },
  }));

  await Auditoria.insertMany(docs);
}

async function seedDemo() {
  try {
    await conectarDB();
    await ensureAdmin();
    await limparDemo();
    await criarConfiguracao();
    const usuarios = await criarUsuarios();
    const clientes = await criarClientes();
    await criarEstoque();
    const ordens = await criarOrdens(clientes, usuarios);
    await criarFinanceiro(ordens);
    await criarNotificacoes(ordens);
    await criarAuditoria(ordens);

    console.log('Carga demonstrativa criada com sucesso.');
    console.log({
      usuarios: usuarios.length + 1,
      clientes: clientes.length,
      ordens: ordens.length,
      estoque: 10,
      financeiro: await LancamentoFinanceiro.countDocuments({ id_lancamento: /^FIN-DEMO-/ }),
      notificacoes: await Notificacao.countDocuments({ id_notificacao: /^NOT-DEMO-/ }),
    });
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar carga demonstrativa:', error);
    process.exit(1);
  }
}

seedDemo();
