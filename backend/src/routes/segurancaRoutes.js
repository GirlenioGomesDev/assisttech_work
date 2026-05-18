const express = require('express');
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const seguranca = require('../controllers/segurancaController');

const router = express.Router();

router.get('/resumo', auth, permit('admin'), seguranca.resumo);
router.post('/sessoes/:id/revogar', auth, permit('admin'), seguranca.revogarSessao);

module.exports = router;
