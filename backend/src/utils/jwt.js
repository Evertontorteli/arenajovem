const jwt = require('jsonwebtoken');

const jwtSecret =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'development'
    ? 'dev-only-change-me'
    : null);

if (!jwtSecret) {
  throw new Error('JWT_SECRET não configurado.');
}

function generateToken(payload) {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = {
  generateToken,
  verifyToken,
};
