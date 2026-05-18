const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const financeiro = require('../controllers/financeiroController');

router.get('/dashboard', auth, permit('admin', 'financeiro'), financeiro.dashboardFinanceiro);
router.get('/lancamentos', auth, permit('admin', 'financeiro'), financeiro.listarLancamentos);
router.post('/lancamentos', auth, permit('admin', 'financeiro'), financeiro.criarLancamento);
router.put('/lancamentos/:id', auth, permit('admin', 'financeiro'), financeiro.atualizarLancamento);
router.delete('/lancamentos/:id', auth, permit('admin', 'financeiro'), financeiro.deletarLancamento);

module.exports = router;
