// Rotas de relatorios.
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const relatorio = require('../controllers/relatorioController');

router.get('/empresa', auth, permit('admin', 'financeiro'), relatorio.relatorioEmpresa);

module.exports = router;
