// Rotas de autenticacao.
const express = require('express');
const router = express.Router();
const { login, logout } = require('../controllers/authController');
const auth = require('../middlewares/authMiddleware');
const rateLimit = require('../middlewares/rateLimit');

router.post('/login', rateLimit({ windowMs: 15 * 60_000, max: 8, keyPrefix: 'login', message: 'Muitas tentativas de login. Aguarde alguns minutos.' }), login);
router.post('/logout', auth, logout);

module.exports = router;
