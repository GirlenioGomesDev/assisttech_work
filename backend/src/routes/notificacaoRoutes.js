// Rotas de notificacoes.
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const notificacao = require('../controllers/notificacaoController');

router.get('/', auth, permit('admin', 'atendente', 'tecnico', 'financeiro'), notificacao.listar);
router.post('/', auth, permit('admin', 'atendente'), notificacao.criarManual);
router.post('/:id/enviar', auth, permit('admin', 'atendente'), notificacao.enviar);
router.post('/:id/cancelar', auth, permit('admin', 'atendente'), notificacao.cancelar);

module.exports = router;
