// Rotas de backup e restauracao.
const express = require('express');
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const backup = require('../controllers/backupController');

const router = express.Router();

router.get('/resumo', auth, permit('admin'), backup.resumo);
router.get('/exportar', auth, permit('admin'), backup.exportar);
router.post('/importar', auth, permit('admin'), backup.importar);

module.exports = router;
