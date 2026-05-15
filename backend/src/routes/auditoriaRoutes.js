const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const auditoria = require('../controllers/auditoriaController');

router.get('/', auth, permit('admin'), auditoria.listarAuditoria);

module.exports = router;
