const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_LOGIN_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
  },
});

router.post('/login', loginLimiter, authController.login);
router.post('/signup', loginLimiter, authController.signup);
router.post('/register', requireAuth, requireRole('ADMIN'), authController.register);

module.exports = router;
