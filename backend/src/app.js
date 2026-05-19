// Configura o Express, seguranca basica, CORS e todas as rotas da API.
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const osRoutes = require('./routes/osRoutes');
const estoqueRoutes = require('./routes/estoqueRoutes');
const relatorioRoutes = require('./routes/relatorioRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const segurancaRoutes = require('./routes/segurancaRoutes');
const configuracaoRoutes = require('./routes/configuracaoRoutes');
const buscaRoutes = require('./routes/buscaRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();

// Origens que podem chamar a API pelo navegador.
const defaultOrigins = 'http://localhost:5173,http://127.0.0.1:5173,https://assisttech-work.vercel.app';
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || defaultOrigins)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

defaultOrigins.split(',').forEach((origin) => {
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
});

app.disable('x-powered-by');
app.use((req, res, next) => {
  // Cabecalhos simples para reduzir exposicao do servidor.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(cors({
  origin(origin, callback) {
    // Permite chamadas sem origin, como healthcheck e ferramentas de API.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem nao permitida pelo CORS'));
  },
}));
app.use(express.json({ limit: '20mb' }));

// Healthcheck usado por monitoramento.
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Cada grupo abaixo envia a URL para seu arquivo de rotas.
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/os', osRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/relatorios', relatorioRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notificacoes', notificacaoRoutes);
app.use('/api/seguranca', segurancaRoutes);
app.use('/api/configuracoes', configuracaoRoutes);
app.use('/api/busca', buscaRoutes);
app.use('/api/backup', backupRoutes);

// Padrao para endpoint inexistente dentro da API.
app.use('/api', (_req, res) => res.status(404).json({ erro: 'Endpoint nao encontrado' }));

// Tratamento final de erros.
app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ erro: status >= 500 ? 'Erro interno do servidor' : error.message });
});

module.exports = app;
