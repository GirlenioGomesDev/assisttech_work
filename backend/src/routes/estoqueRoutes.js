const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const estoque = require('../controllers/estoqueController');

router.get('/', auth, permit('admin', 'atendente', 'financeiro'), estoque.listarItens);
router.post('/', auth, permit('admin', 'atendente', 'financeiro'), estoque.criarItem);
router.put('/:id', auth, permit('admin', 'atendente', 'financeiro'), estoque.atualizarItem);
router.delete('/:id', auth, permit('admin', 'atendente', 'financeiro'), estoque.deletarItem);

module.exports = router;
