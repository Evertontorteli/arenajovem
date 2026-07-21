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

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas solicitações de recuperação. Tente novamente em alguns minutos.',
  },
});

const verifyResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
});

router.post('/login', loginLimiter, authController.login);
router.post('/signup', loginLimiter, authController.signup);
router.post('/register', requireAuth, requireRole('ADMIN'), authController.register);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/verify-reset-code', verifyResetLimiter, authController.verifyResetCode);
router.post('/reset-password', verifyResetLimiter, authController.resetPassword);

module.exports = router;
