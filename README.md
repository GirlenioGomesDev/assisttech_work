# AssisTech

Sistema web para gestão de assistências técnicas de celulares e notebooks.

## Introdução

O AssisTech foi desenvolvido pensando em uma situação comum em assistências técnicas pequenas: muitas informações importantes acabam ficando espalhadas em cadernos, planilhas, mensagens ou anotações soltas. Isso pode dificultar o acompanhamento de um aparelho, o histórico de um cliente e o andamento de uma ordem de serviço.

A proposta do sistema é organizar esse fluxo de trabalho em um ambiente web. Nele é possível cadastrar clientes, registrar aparelhos, abrir ordens de serviço e acompanhar cada etapa do atendimento, desde a entrada do equipamento até a entrega.

O projeto não tenta substituir um sistema comercial completo, mas sim resolver de forma prática o controle básico de uma assistência técnica, mantendo as informações centralizadas e mais fáceis de consultar.

## Objetivo do Projeto

Este projeto foi criado como prática acadêmica e também como forma de aprofundar o aprendizado em desenvolvimento full stack.

A ideia principal foi construir uma aplicação completa, separando frontend e backend, trabalhando com autenticação, banco de dados, rotas de API e uma interface voltada para uso real. Durante o desenvolvimento, o foco foi entender melhor como as partes de um sistema web se comunicam e como organizar um projeto um pouco maior do que exemplos simples de estudo.

## Funcionalidades

Entre as funcionalidades já implementadas no sistema estão:

- Cadastro de clientes
- Cadastro e consulta de aparelhos
- Criação de ordens de serviço
- Controle de status da ordem de serviço
- Registro de diagnóstico técnico
- Registro de orçamento
- Aprovação ou rejeição de orçamento
- Controle de execução do serviço
- Registro de pagamentos
- Confirmação de entrega do aparelho
- Histórico relacionado ao cliente
- Listagem de ordens de serviço
- Filtros e busca de informações
- Dashboard com dados do banco
- Cadastro de usuários
- Controle de acesso por perfil
- Login com autenticação JWT
- Integração com MongoDB usando Mongoose

## Perfis de Usuário

O sistema trabalha com diferentes perfis para organizar melhor o acesso às funcionalidades:

- **admin**: possui acesso geral ao sistema
- **atendente**: atua no cadastro de clientes, abertura de ordens e entrega
- **tecnico**: acompanha diagnóstico, orçamento e execução dos serviços
- **financeiro**: acessa informações ligadas a pagamentos e relatórios

## Tecnologias Utilizadas

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Recharts

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- dotenv

## Estrutura do Projeto

A estrutura foi separada em duas partes principais: uma para a interface do usuário e outra para a API.

```bash
assisttech/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   ├── api/
│   ├── package.json
│   └── vercel.json
│
└── README.md
```

De forma resumida, o `frontend` concentra as telas, componentes e estilos da aplicação. O `backend` fica responsável pelas regras de negócio, autenticação, rotas da API e comunicação com o banco de dados.

## Como Rodar o Projeto

Antes de iniciar, é necessário ter o Node.js instalado e uma conexão com MongoDB. No desenvolvimento foi utilizado MongoDB Atlas, mas também é possível configurar um MongoDB local se preferir.

### Backend

Entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` com base no arquivo de exemplo:

```bash
copy .env.example .env
```

Configure as variáveis principais no `.env`, principalmente:

```env
PORT=3000
MONGO_URI=sua_string_de_conexao_do_mongodb
JWT_SECRET=sua_chave_secreta
FRONTEND_URL=http://localhost:5173
```

Depois, inicie o backend:

```bash
npm run dev
```

A API deve ficar disponível em:

```text
http://localhost:3000/api/health
```

### Frontend

Em outro terminal, entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env`:

```bash
copy .env.example .env
```

Configure a URL da API:

```env
VITE_API_URL=http://localhost:3000/api
```

Inicie o frontend:

```bash
npm run dev
```

O sistema deve abrir em:

```text
http://localhost:5173
```

## Usuário Inicial

O sistema possui configuração para criação de um usuário administrador inicial.

Dados padrão usados no ambiente de desenvolvimento:

- login: `admin`
- senha: `admin123`

Esses dados podem ser alterados pelas variáveis de ambiente do backend.

## Decisões Técnicas

O MongoDB foi escolhido porque o formato dos dados do sistema combina bem com documentos. Uma ordem de serviço, por exemplo, pode reunir informações do cliente, aparelho, diagnóstico, orçamento e histórico de atendimento. Isso torna o modelo mais flexível para evoluir durante o desenvolvimento.

A separação entre frontend e backend foi feita para deixar o projeto mais organizado. O frontend cuida da experiência do usuário e das telas, enquanto o backend concentra as regras, validações, autenticação e acesso ao banco de dados. Essa divisão também facilita futuras mudanças, como publicar a API e a interface em ambientes diferentes.

O React foi utilizado por ser uma tecnologia bastante comum no desenvolvimento web atual e por facilitar a criação de interfaces divididas em componentes. Como o sistema possui várias telas e formulários, essa abordagem ajudou a manter o código mais organizado.

## Melhorias Futuras

Algumas melhorias que fazem sentido para a evolução do projeto:

- Criar um dashboard mais completo, com mais indicadores da assistência
- Melhorar os relatórios e permitir filtros mais avançados
- Adicionar upload de imagens dos aparelhos e comprovantes
- Criar notificações mais completas para eventos importantes
- Melhorar a impressão ou exportação de ordens de serviço
- Adicionar testes automatizados no backend e no frontend
- Revisar permissões de acesso com mais detalhes por perfil

## Conclusão

O AssisTech é um projeto em evolução, desenvolvido com foco em aprendizado e aplicação prática de conceitos de desenvolvimento full stack.

Durante a construção do sistema, foi possível trabalhar com cadastro de dados, autenticação, organização de rotas, integração com banco de dados e criação de uma interface funcional. Ainda existem pontos que podem ser melhorados, mas o projeto já representa uma base realista para entender como um sistema de gestão pode ser estruturado.
