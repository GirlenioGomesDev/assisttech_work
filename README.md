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

## Variáveis de ambiente

### backend/.env

O projeto já está com a configuração do Atlas que você informou:

```env
PORT=3000
MONGO_URI=mongodb+srv://grupofacu:trabalhofacu@cluster0.zgcgxxq.mongodb.net/assisttech?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=chave_super_secreta_123456
ADMIN_NOME=Administrador
ADMIN_EMAIL=admin@email.com
ADMIN_LOGIN=admin
ADMIN_SENHA=123456
FRONTEND_URL=http://localhost:5173
```

### frontend/.env

```env
VITE_API_URL=http://localhost:3000/api
```

## Como rodar localmente no Windows

### Backend

```cmd
cd backend
npm install
copy .env.example .env
npm run seed:admin
npm run dev
```

> Se você já quiser usar o `.env` que foi enviado no ZIP, não precisa copiar de novo.

### Frontend

```cmd
cd frontend
npm install
copy .env.example .env
npm run dev
```

Acesse:

```text
http://localhost:5173
```

Login inicial:

```text
usuário: admin
senha: 123456
```

## MongoDB Atlas

Você não precisa criar o banco manualmente.

O banco `assisttech` será criado automaticamente quando o primeiro dado for salvo.

No Atlas, faça isto antes de testar:

1. abra o projeto
2. vá em **Network Access**
3. clique em **Add IP Address**
4. libere `0.0.0.0/0`

## Deploy na Vercel

## 1. Subir para o GitHub

Na raiz do projeto:

```bash
git init
git add .
git commit -m "Projeto AssistTech pronto para deploy"
git branch -M main
git remote add origin SEU_REPOSITORIO_GITHUB
git push -u origin main
```

## 2. Deploy do backend na Vercel

Crie um novo projeto na Vercel apontando para este repositório.

Configuração do backend:

- **Root Directory:** `backend`
- não precisa mudar framework preset manualmente
- o projeto já possui `vercel.json`

Variáveis do backend na Vercel:

```env
MONGO_URI=mongodb+srv://grupofacu:trabalhofacu@cluster0.zgcgxxq.mongodb.net/assisttech?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=chave_super_secreta_123456
ADMIN_NOME=Administrador
ADMIN_EMAIL=admin@email.com
ADMIN_LOGIN=admin
ADMIN_SENHA=123456
FRONTEND_URL=https://SEU-FRONTEND.vercel.app
```

Depois do deploy, sua API ficará parecida com:

```text
https://seu-backend.vercel.app/api
```

## 3. Deploy do frontend na Vercel

Crie outro projeto na Vercel para o frontend.

Configuração do frontend:

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Variável do frontend:

```env
VITE_API_URL=https://SEU-BACKEND.vercel.app/api
```

## Observações importantes

- o arquivo `backend/.env` não deve ser enviado ao GitHub público
- o `.gitignore` já está configurado para ignorar `.env`
- removi o diretório de componentes de Figma e qualquer vestígio direto desse gerador do projeto final
- o cadastro de aparelho foi centralizado pela criação da OS, porque o aparelho já entra vinculado ao atendimento correto
- a página de aparelhos agora mostra os aparelhos reais cadastrados nas ordens de serviço

## O que foi corrigido nesta versão

- técnico agora consegue salvar diagnóstico
- orçamento agora pode ser salvo
- orçamento pode ser aprovado ou rejeitado
- execução do serviço pode ser registrada
- pagamento pode ser registrado
- entrega pode ser confirmada
- status da OS pode ser alterado
- listagem de técnicos foi criada no backend
- páginas que ainda estavam usando dados mock foram ligadas ao banco
- backend ajustado para Atlas + Vercel

