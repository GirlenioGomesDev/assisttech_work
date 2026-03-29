const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const u = require('../controllers/usuarioController');

router.post('/', auth, permit('admin'), u.criarUsuario);
router.get('/', auth, permit('admin'), u.listarUsuarios);
router.get('/tecnicos', auth, permit('admin', 'atendente', 'tecnico', 'financeiro'), u.listarTecnicos);

module.exports = router;
