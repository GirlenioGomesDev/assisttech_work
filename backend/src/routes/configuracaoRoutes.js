// Rotas de configuracoes do sistema.
const express = require('express');
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const configuracao = require('../controllers/configuracaoController');

const router = express.Router();

router.get('/publica', configuracao.publica);
router.get('/', auth, permit('admin', 'atendente', 'tecnico', 'financeiro'), configuracao.buscar);
router.put('/', auth, permit('admin'), configuracao.salvar);

module.exports = router;
