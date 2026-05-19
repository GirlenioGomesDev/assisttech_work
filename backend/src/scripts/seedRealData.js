// Popula o banco com dados de exemplo mais proximos do uso real.
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
const diasAtras = (dias) => new Date(now.getTime() - dias * 86400000);
const diasFrente = (dias) => new Date(now.getTime() + dias * 86400000);
const competencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const usuarioSistema = { id: 'USR-0001', nome: 'Administrador' };

async function limparCargaAnterior() {
  await Promise.all([
    Cliente.deleteMany({ $or: [{ id_cliente: /^CLI-DEMO-/ }, { email: /@portfolio\.assisttech$/ }] }),
    Usuario.deleteMany({ $or: [{ login: /^demo\./ }, { login: /^atendimento\.|^tecnico\.|^financeiro\./ }] }),
    EstoqueMovimentacao.deleteMany({ $or: [{ id_movimentacao: /^MOV-DEMO-/ }, { id_movimentacao: /^MOV-24-/ }] }),
    EstoqueItem.deleteMany({ $or: [{ id_item: /^EST-DEMO-/ }, { id_item: /^PEC-/ }] }),
    LancamentoFinanceiro.deleteMany({ $or: [{ id_lancamento: /^FIN-DEMO-/ }, { id_lancamento: /^FIN-24-/ }] }),
    Notificacao.deleteMany({ $or: [{ id_notificacao: /^NOT-DEMO-/ }, { id_notificacao: /^MSG-24-/ }] }),
    OrdemServico.deleteMany({ $or: [{ id_os: /^OS-DEMO-/ }, { id_os: /^OS-24-/ }] }),
    Auditoria.deleteMany({ $or: [{ entidade_codigo: /^DEMO-/ }, { entidade_codigo: /^CARGA-REALISTA-/ }] }),
  ]);
}

async function configurarAssistencia() {
  return ConfiguracaoSistema.findOneAndUpdate(
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
        cobertura_garantia: 'Garantia de 90 dias para servico executado e pecas substituidas, exceto mau uso, queda, umidade ou violacao de lacre.',
        prazo_orcamento_horas: 24,
        horario_atendimento: 'Segunda a sexta, 08h as 18h; sabado, 09h as 13h',
      },
      documentos: {
        rodape_os: 'TechPrime Assistencia - diagnostico transparente, pecas testadas e garantia registrada.',
        termo_garantia: 'A garantia cobre apenas o defeito reparado nesta OS. Perde a validade em caso de queda, liquido, violacao de lacres, tentativa de reparo por terceiros ou dano diferente do relatado.',
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
    ['USR-2401', 'Marina Alves', 'atendimento.marina', 'marina.alves@techprimeassistencia.com.br', 'atendente'],
    ['USR-2402', 'Rafael Moreira', 'tecnico.rafael', 'rafael.moreira@techprimeassistencia.com.br', 'tecnico'],
    ['USR-2403', 'Camila Rocha', 'tecnico.camila', 'camila.rocha@techprimeassistencia.com.br', 'tecnico'],
    ['USR-2404', 'Bruno Ferreira', 'financeiro.bruno', 'bruno.ferreira@techprimeassistencia.com.br', 'financeiro'],
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

  return Usuario.find({ id_usuario: /^USR-24/ }).lean();
}

async function criarClientes() {
  const clientes = [
    ['CLI-2401', 'Ana Carolina Martins', '11987654321', '12345678901', 'ana.martins@portfolio.assisttech', 'Vila Mariana', 'Cliente recorrente. Prefere contato por WhatsApp no periodo da tarde.'],
    ['CLI-2402', 'Joao Pedro Almeida', '11976543210', '98765432100', 'joao.almeida@portfolio.assisttech', 'Bela Vista', 'Solicita recibo detalhado para reembolso corporativo.'],
    ['CLI-2403', 'Patricia Nogueira', '11988887777', '32165498709', 'patricia.nogueira@portfolio.assisttech', 'Consolacao', 'Prioridade alta por usar notebook para trabalho remoto.'],
    ['CLI-2404', 'Lucas Henrique Souza', '11970001122', '45678912300', 'lucas.souza@portfolio.assisttech', 'Ipiranga', 'Aparelho entrou com sinais de queda e pelicula quebrada.'],
    ['CLI-2405', 'Fernanda Lima Costa', '11961112233', '65498732111', 'fernanda.costa@portfolio.assisttech', 'Perdizes', 'Autorizou reparo se valor total ficar abaixo de R$ 450,00.'],
    ['CLI-2406', 'Renato Carvalho', '11995556677', '14725836900', 'renato.carvalho@portfolio.assisttech', 'Itaim Bibi', 'Cliente em garantia. Solicita retorno tecnico detalhado.'],
  ];

  await Cliente.insertMany(clientes.map(([id_cliente, nome, telefone, cpf, email, bairro, observacoes], index) => ({
    id_cliente,
    nome,
    telefone,
    whatsapp: telefone,
    cpf,
    email,
    endereco: {
      rua: ['Rua Bela Vista', 'Av. Paulista', 'Rua Augusta', 'Rua Vergueiro', 'Rua Turiassu', 'Rua Clodomiro Amazonas'][index],
      numero: ['84', '1578', '900', '2100', '450', '72'][index],
      bairro,
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: ['04101000', '01310200', '01305000', '04273000', '05005000', '04537000'][index],
    },
    observacoes,
    ativo: true,
  })));

  return Cliente.find({ id_cliente: /^CLI-24/ }).lean();
}

async function criarEstoque() {
  const itens = [
    ['PEC-2401', 'Tela iPhone 11 Premium', 'Tela', 'Apple', 'iPhone 11', 6, 2, 380, 310, 'Prime Parts'],
    ['PEC-2402', 'Bateria Samsung A32', 'Bateria', 'Samsung', 'A32', 4, 2, 160, 118, 'Mobile Center'],
    ['PEC-2403', 'Conector de carga Moto G60', 'Conector', 'Motorola', 'G60', 2, 3, 95, 62, 'Tecno Distribuidora'],
    ['PEC-2404', 'SSD Kingston 480GB', 'Armazenamento', 'Kingston', 'A400', 8, 3, 280, 215, 'InfoParts'],
    ['PEC-2405', 'Memoria DDR4 Notebook 8GB', 'Memoria', 'Crucial', 'DDR4 2666', 5, 2, 190, 145, 'InfoParts'],
    ['PEC-2406', 'Teclado Dell Inspiron 15', 'Teclado', 'Dell', 'Inspiron 15', 1, 2, 220, 170, 'NoteFix'],
    ['PEC-2407', 'Fonte Notebook Universal 90W', 'Fonte', 'Multilaser', '90W', 7, 2, 140, 95, 'NoteFix'],
    ['PEC-2408', 'Pelicula 3D iPhone 12', 'Acessorio', 'Apple', 'iPhone 12', 14, 5, 35, 12, 'Prime Parts'],
    ['PEC-2409', 'Cooler Lenovo Ideapad', 'Refrigeracao', 'Lenovo', 'Ideapad 320', 2, 2, 130, 88, 'NoteFix'],
    ['PEC-2410', 'Cabo flat Samsung A20', 'Flex', 'Samsung', 'A20', 1, 3, 70, 38, 'Mobile Center'],
  ];

  const criados = await EstoqueItem.insertMany(itens.map(([id_item, nome, categoria, marca, modelo, quantidade, estoque_minimo, valor_unitario, custo_medio, fornecedor]) => ({
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
    observacoes: 'Item comprado para reposicao de bancada e reparos em andamento.',
    ativo: true,
  })));

  await EstoqueMovimentacao.insertMany(criados.map((item, index) => ({
    id_movimentacao: `MOV-24-${String(index + 1).padStart(4, '0')}`,
    item: item._id,
    id_item: item.id_item,
    nome_item: item.nome,
    tipo: 'entrada',
    quantidade: item.quantidade,
    quantidade_anterior: 0,
    quantidade_atual: item.quantidade,
    custo_unitario: item.custo_medio,
    origem: 'compra',
    observacao: 'Entrada por compra de fornecedor',
    usuario: usuarioSistema,
  })));
}

function osBase({ n, cliente, tecnico, aparelho, status, prioridade, defeito, diagnostico, orcamento, pagamento, entrega, dias, prazo, pecas = [] }) {
  const id_os = `OS-24-${String(n).padStart(4, '0')}`;
  const criadaEm = diasAtras(dias);
  const eventos = [
    { tipo: 'sistema', titulo: 'OS aberta', descricao: `Ordem criada para ${cliente.nome}`, usuario: 'Marina Alves', data: criadaEm },
    ...(diagnostico ? [{ tipo: 'tecnico', titulo: 'Diagnostico salvo', descricao: diagnostico.defeito_identificado, usuario: tecnico.nome, data: diasAtras(Math.max(dias - 1, 0)) }] : []),
    ...(orcamento ? [{ tipo: 'financeiro', titulo: 'Orcamento registrado', descricao: `Total aprovado: R$ ${Number(orcamento.valor_total || 0).toFixed(2)}`, usuario: 'Bruno Ferreira', data: diasAtras(Math.max(dias - 2, 0)) }] : []),
    ...(status === 'pronto' ? [{ tipo: 'status', titulo: 'OS pronta', descricao: 'Aparelho pronto para retirada', usuario: tecnico.nome, data: diasAtras(1) }] : []),
    ...(status === 'entregue' ? [{ tipo: 'cliente', titulo: 'Entrega registrada', descricao: `Entregue para ${cliente.nome}`, usuario: 'Marina Alves', data: diasAtras(0) }] : []),
  ];

  return {
    id_os,
    numero_os: 240000 + n,
    cliente: { id_cliente: cliente.id_cliente, nome: cliente.nome, telefone: cliente.telefone, whatsapp: cliente.whatsapp },
    tecnico: { id_usuario: tecnico.id_usuario, nome: tecnico.nome },
    aparelho: { id_aparelho: `APR-24-${String(n).padStart(4, '0')}`, ...aparelho, data_cadastro: criadaEm },
    data_entrada: criadaEm,
    defeito_relatado: defeito,
    diagnostico_resumido: diagnostico?.defeito_identificado,
    status,
    prioridade,
    prazo_estimado: diasFrente(prazo),
    observacoes_gerais: 'Cliente autorizou contato por WhatsApp para atualizacoes da ordem de servico.',
    diagnostico,
    orcamento,
    pecas_utilizadas: pecas,
    pagamento,
    entrega,
    data_conclusao: ['pronto', 'entregue'].includes(status) ? diasAtras(1) : undefined,
    data_entrega: status === 'entregue' ? diasAtras(0) : undefined,
    checklists: {
      entrada: [
        { chave: 'fotos_entrada', label: 'Fotos do aparelho registradas', checked: true },
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
      cobertura: 'Garantia de 90 dias para o reparo executado e pecas substituidas.',
      observacoes: 'Garantia explicada no ato da retirada.',
    } : undefined,
    eventos,
    historico_status: eventos.map((evento) => ({ status: evento.titulo, usuario: evento.usuario, data: evento.data })),
    logs: eventos.map((evento) => ({ acao: evento.titulo, usuario: evento.usuario, data: evento.data })),
    createdAt: criadaEm,
    updatedAt: diasAtras(0),
  };
}

async function criarOrdens(clientes, usuarios) {
  const rafael = usuarios.find((u) => u.login === 'tecnico.rafael');
  const camila = usuarios.find((u) => u.login === 'tecnico.camila');
  const ordens = [
    osBase({ n: 1, cliente: clientes[0], tecnico: rafael, aparelho: { tipo_aparelho: 'celular', marca: 'Apple', modelo: 'iPhone 11', cor: 'Preto', imei_ou_serial: '356789112233445', acessorios_entregues: ['capinha'], estado_fisico: 'Tela trincada e tampa traseira com riscos leves' }, status: 'aguardando_aprovacao', prioridade: 'alta', defeito: 'Tela quebrada apos queda. Touch responde parcialmente.', diagnostico: { defeito_identificado: 'Display danificado com falha no touch', testes_realizados: ['teste de imagem', 'teste de touch'], causa_provavel: 'Impacto fisico', solucao_recomendada: 'Troca do modulo de tela', pecas_necessarias: ['Tela iPhone 11 Premium'], observacoes_tecnicas: 'Face ID preservado' }, orcamento: { valor_mao_obra: 120, valor_pecas: 380, valor_total: 500, status_aprovacao: 'pendente', data_orcamento: diasAtras(1) }, dias: 3, prazo: 1, pecas: [{ id_peca: 'PEC-2401', nome_peca: 'Tela iPhone 11 Premium', tipo_peca: 'Tela', marca_peca: 'Apple', quantidade: 1, valor_unitario: 380 }] }),
    osBase({ n: 2, cliente: clientes[1], tecnico: camila, aparelho: { tipo_aparelho: 'notebook', marca: 'Dell', modelo: 'Inspiron 15', cor: 'Prata', imei_ou_serial: 'DLINSP152023', acessorios_entregues: ['fonte original'], estado_fisico: 'Carcaca em bom estado' }, status: 'em_reparo', prioridade: 'media', defeito: 'Notebook lento e travando ao abrir programas.', diagnostico: { defeito_identificado: 'HD com setores defeituosos e sistema corrompido', testes_realizados: ['SMART', 'memoria', 'stress CPU'], causa_provavel: 'Desgaste do HD', solucao_recomendada: 'Troca por SSD e reinstalacao do sistema', pecas_necessarias: ['SSD Kingston 480GB'], observacoes_tecnicas: 'Backup de dados solicitado pelo cliente' }, orcamento: { valor_mao_obra: 180, valor_pecas: 280, valor_total: 460, status_aprovacao: 'aprovado', data_orcamento: diasAtras(4), data_aprovacao: diasAtras(3), observacao_aprovacao: 'Aprovado por WhatsApp' }, dias: 6, prazo: 2, pecas: [{ id_peca: 'PEC-2404', nome_peca: 'SSD Kingston 480GB', tipo_peca: 'Armazenamento', marca_peca: 'Kingston', quantidade: 1, valor_unitario: 280 }] }),
    osBase({ n: 3, cliente: clientes[2], tecnico: rafael, aparelho: { tipo_aparelho: 'notebook', marca: 'Lenovo', modelo: 'Ideapad 320', cor: 'Cinza', imei_ou_serial: 'LN3209981', acessorios_entregues: ['fonte'], estado_fisico: 'Marcas leves de uso' }, status: 'pronto', prioridade: 'urgente', defeito: 'Notebook desligando depois de alguns minutos.', diagnostico: { defeito_identificado: 'Cooler travado e pasta termica ressecada', testes_realizados: ['temperatura', 'stress CPU'], causa_provavel: 'Superaquecimento', solucao_recomendada: 'Troca do cooler e limpeza interna', pecas_necessarias: ['Cooler Lenovo Ideapad'], observacoes_tecnicas: 'Temperatura normalizada apos reparo' }, orcamento: { valor_mao_obra: 160, valor_pecas: 130, valor_total: 290, status_aprovacao: 'aprovado', data_orcamento: diasAtras(5), data_aprovacao: diasAtras(5) }, pagamento: { valor_bruto: 290, desconto: 0, valor_final: 290, forma_pagamento: 'pix', status_pagamento: 'pago', data_pagamento: diasAtras(1), observacoes: 'Pagamento antecipado via PIX' }, dias: 7, prazo: -1, pecas: [{ id_peca: 'PEC-2409', nome_peca: 'Cooler Lenovo Ideapad', tipo_peca: 'Refrigeracao', marca_peca: 'Lenovo', quantidade: 1, valor_unitario: 130 }] }),
    osBase({ n: 4, cliente: clientes[3], tecnico: camila, aparelho: { tipo_aparelho: 'celular', marca: 'Samsung', modelo: 'Galaxy A32', cor: 'Azul', imei_ou_serial: '359999888877776', acessorios_entregues: ['sem acessorios'], estado_fisico: 'Tela sem marcas, tampa com riscos' }, status: 'entregue', prioridade: 'media', defeito: 'Bateria descarregando muito rapido.', diagnostico: { defeito_identificado: 'Bateria com baixa capacidade', testes_realizados: ['ciclo de carga', 'consumo em standby'], causa_provavel: 'Desgaste natural', solucao_recomendada: 'Troca de bateria', pecas_necessarias: ['Bateria Samsung A32'], observacoes_tecnicas: 'Teste final aprovado' }, orcamento: { valor_mao_obra: 90, valor_pecas: 160, valor_total: 250, status_aprovacao: 'aprovado', data_orcamento: diasAtras(9), data_aprovacao: diasAtras(8) }, pagamento: { valor_bruto: 250, desconto: 20, valor_final: 230, forma_pagamento: 'cartao_debito', status_pagamento: 'pago', data_pagamento: diasAtras(2), observacoes: 'Desconto fidelidade' }, entrega: { data_entrega: diasAtras(1), recebedor_nome: 'Lucas Henrique Souza', recebedor_documento: '45678912300', observacoes: 'Cliente testou aparelho no balcao' }, dias: 10, prazo: -2, pecas: [{ id_peca: 'PEC-2402', nome_peca: 'Bateria Samsung A32', tipo_peca: 'Bateria', marca_peca: 'Samsung', quantidade: 1, valor_unitario: 160 }] }),
    osBase({ n: 5, cliente: clientes[4], tecnico: rafael, aparelho: { tipo_aparelho: 'celular', marca: 'Motorola', modelo: 'Moto G60', cor: 'Verde', imei_ou_serial: '358181818181818', acessorios_entregues: ['capinha'], estado_fisico: 'Conector com folga visivel' }, status: 'aguardando_peca', prioridade: 'baixa', defeito: 'Aparelho nao carrega em alguns cabos.', diagnostico: { defeito_identificado: 'Conector de carga oxidado', testes_realizados: ['teste com fonte bancada', 'teste de cabo'], causa_provavel: 'Oxidacao por umidade', solucao_recomendada: 'Troca do conector de carga', pecas_necessarias: ['Conector de carga Moto G60'], observacoes_tecnicas: 'Aguardando reposicao de fornecedor' }, orcamento: { valor_mao_obra: 110, valor_pecas: 95, valor_total: 205, status_aprovacao: 'aprovado', data_orcamento: diasAtras(2), data_aprovacao: diasAtras(1) }, dias: 4, prazo: 4, pecas: [{ id_peca: 'PEC-2403', nome_peca: 'Conector de carga Moto G60', tipo_peca: 'Conector', marca_peca: 'Motorola', quantidade: 1, valor_unitario: 95 }] }),
    osBase({ n: 6, cliente: clientes[5], tecnico: camila, aparelho: { tipo_aparelho: 'notebook', marca: 'Acer', modelo: 'Aspire 5', cor: 'Prata', imei_ou_serial: 'ACASP5A515', acessorios_entregues: ['fonte paralela'], estado_fisico: 'Dobradica esquerda com folga' }, status: 'em_diagnostico', prioridade: 'alta', defeito: 'Notebook nao liga apos queda da mesa.', diagnostico: { defeito_identificado: 'Em analise de placa e alimentacao', testes_realizados: ['inspecao visual', 'fonte bancada'], causa_provavel: 'Possivel curto na entrada de energia', solucao_recomendada: 'Aguardar diagnostico completo', pecas_necessarias: [], observacoes_tecnicas: 'Sem autorizacao para reparo ainda' }, dias: 1, prazo: 1 }),
    osBase({ n: 7, cliente: clientes[0], tecnico: rafael, aparelho: { tipo_aparelho: 'celular', marca: 'Apple', modelo: 'iPhone 12', cor: 'Branco', imei_ou_serial: '351212121212121', acessorios_entregues: ['sem acessorios'], estado_fisico: 'Aparelho em bom estado' }, status: 'aberta', prioridade: 'media', defeito: 'Cliente solicita aplicacao de pelicula e limpeza de alto-falante.', dias: 0, prazo: 2 }),
    osBase({ n: 8, cliente: clientes[1], tecnico: camila, aparelho: { tipo_aparelho: 'celular', marca: 'Samsung', modelo: 'A20', cor: 'Preto', imei_ou_serial: '352020202020202', acessorios_entregues: ['capinha', 'chip removido'], estado_fisico: 'Tela trincada, tampa descolando' }, status: 'cancelada', prioridade: 'baixa', defeito: 'Tela nao acende.', diagnostico: { defeito_identificado: 'Display e cabo flat danificados', testes_realizados: ['teste com display externo'], causa_provavel: 'Impacto fisico', solucao_recomendada: 'Troca de display e cabo flat', pecas_necessarias: ['Cabo flat Samsung A20'], observacoes_tecnicas: 'Cliente nao aprovou orcamento' }, orcamento: { valor_mao_obra: 130, valor_pecas: 70, valor_total: 200, status_aprovacao: 'rejeitado', data_orcamento: diasAtras(12), data_aprovacao: diasAtras(11), observacao_aprovacao: 'Cliente optou por nao reparar' }, dias: 14, prazo: -10 }),
  ];

  await OrdemServico.insertMany(ordens);
  return OrdemServico.find({ id_os: /^OS-24-/ }).lean();
}

async function criarFinanceiro(ordens) {
  const receitas = ordens.filter((os) => os.pagamento?.valor_final).map((os, index) => ({
    id_lancamento: `FIN-24-REC-${String(index + 1).padStart(3, '0')}`,
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
    observacoes: 'Lancamento gerado a partir de ordem de servico',
    usuario: usuarioSistema,
    ativo: true,
  }));

  const despesas = [
    ['FIN-24-DES-001', 'Compra de pecas', 'Pedido Prime Parts - telas e peliculas', 1840, 'pago', 'transferencia'],
    ['FIN-24-DES-002', 'Aluguel', 'Aluguel da loja', 2200, 'pago', 'boleto'],
    ['FIN-24-DES-003', 'Ferramentas', 'Estacao de solda e insumos', 690, 'pendente', 'boleto'],
    ['FIN-24-DES-004', 'Marketing', 'Campanha local Google/Instagram', 350, 'pago', 'cartao_credito'],
  ].map(([id_lancamento, categoria, descricao, valor, status, forma_pagamento], index) => ({
    id_lancamento, tipo: 'despesa', categoria, descricao, valor, status, forma_pagamento,
    vencimento: diasAtras(index + 1),
    data_pagamento: status === 'pago' ? diasAtras(index + 1) : undefined,
    competencia,
    origem: 'manual',
    observacoes: 'Despesa operacional registrada no fluxo de caixa',
    usuario: usuarioSistema,
    ativo: true,
  }));

  await LancamentoFinanceiro.insertMany([...receitas, ...despesas]);
}

async function criarNotificacoes(ordens) {
  await Notificacao.insertMany(ordens.slice(0, 6).map((os, index) => ({
    id_notificacao: `MSG-24-${String(index + 1).padStart(4, '0')}`,
    canal: index % 2 === 0 ? 'whatsapp' : 'email',
    tipo: index % 2 === 0 ? 'status_atualizado' : 'orcamento_salvo',
    status: index < 3 ? 'enviado' : 'pendente',
    destinatario: {
      nome: os.cliente.nome,
      telefone: os.cliente.whatsapp || os.cliente.telefone,
      email: `${os.cliente.nome.toLowerCase().replace(/\s+/g, '.')}@portfolio.assisttech`,
      id_cliente: os.cliente.id_cliente,
    },
    assunto: `Atualizacao da ${os.id_os}`,
    mensagem: `Ola, ${os.cliente.nome}! Temos uma atualizacao sobre a ${os.id_os}. Status atual: ${os.status}.`,
    entidade: 'os',
    entidade_id: String(os._id),
    entidade_codigo: os.id_os,
    enviado_em: index < 3 ? diasAtras(index) : undefined,
    tentativas: index < 3 ? 1 : 0,
    metadata: { status: os.status },
    criado_por: usuarioSistema,
  })));
}

async function criarAuditoria(ordens) {
  await Auditoria.insertMany([
    { acao: 'carga_inicial', entidade: 'sistema', entidade_codigo: 'CARGA-REALISTA-001', descricao: 'Carga realista inicial criada para avaliacao completa do sistema' },
    ...ordens.slice(0, 5).map((os) => ({
      acao: 'os_criada',
      entidade: 'os',
      entidade_id: String(os._id),
      entidade_codigo: `CARGA-REALISTA-${os.id_os}`,
      descricao: `OS ${os.id_os} criada para ${os.cliente.nome}`,
      metadata: { status: os.status },
    })),
  ].map((item) => ({ ...item, usuario: { id: 'USR-0001', nome: 'Administrador', perfis: ['admin'] } })));
}

async function seedRealData() {
  try {
    await conectarDB();
    await ensureAdmin();
    await limparCargaAnterior();
    await configurarAssistencia();
    const usuarios = await criarUsuarios();
    const clientes = await criarClientes();
    await criarEstoque();
    const ordens = await criarOrdens(clientes, usuarios);
    await criarFinanceiro(ordens);
    await criarNotificacoes(ordens);
    await criarAuditoria(ordens);

    console.log('Carga realista criada com sucesso.');
    console.log({
      usuarios_operacionais: usuarios.length,
      clientes: clientes.length,
      ordens_servico: ordens.length,
      itens_estoque: await EstoqueItem.countDocuments({ id_item: /^PEC-/ }),
      lancamentos_financeiros: await LancamentoFinanceiro.countDocuments({ id_lancamento: /^FIN-24-/ }),
      notificacoes: await Notificacao.countDocuments({ id_notificacao: /^MSG-24-/ }),
    });
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar carga realista:', error);
    process.exit(1);
  }
}

seedRealData();
