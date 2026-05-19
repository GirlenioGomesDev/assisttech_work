# AssistTech - Sistema de Gestão para Assistência Técnica

Sistema web para assistência técnica de celulares e notebooks, com frontend em React + Vite e backend em Node.js + Express usando MongoDB Atlas.

## O que já está funcionando

- login com JWT
- controle de acesso por perfil
- cadastro de clientes
- cadastro de usuários
- abertura de ordens de serviço
- listagem e filtro de OS
- tela de detalhes da OS com ações reais
- diagnóstico técnico
- orçamento
- aprovação ou rejeição do orçamento
- execução do serviço
- registro de pagamento
- confirmação de entrega
- dashboard com dados reais do banco
- listagem real de aparelhos, pagamentos, entregas e histórico do cliente
- backend preparado para deploy na Vercel
- frontend preparado para deploy na Vercel

## Perfis

- **admin**: acesso total
- **atendente**: clientes, abertura de OS, aprovação de orçamento, entrega
- **tecnico**: diagnóstico, orçamento, execução e atualização de status
- **financeiro**: pagamentos e relatórios

## Estrutura

```bash
assisttech/
├── frontend/
├── backend/
└── README.md
```

## Rodando localmente

Requisitos:

- Node.js
- MongoDB local ou MongoDB Atlas

Backend:

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Acesse:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api/health

Usuario inicial:

- login: `admin`
- senha: `admin123`
