const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const { permit } = require('../middlewares/authMiddleware');
const dashboard = require('../controllers/dashboardController');

router.get('/executivo', auth, permit('admin', 'atendente', 'tecnico', 'financeiro'), dashboard.executivo);

module.exports = router;
