// Rotas da busca global.
const express = require('express');
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const busca = require('../controllers/buscaController');

const router = express.Router();

router.get('/global', auth, permit('admin', 'atendente', 'tecnico', 'financeiro'), busca.global);

module.exports = router;
