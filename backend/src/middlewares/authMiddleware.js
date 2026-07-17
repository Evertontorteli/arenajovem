const { verifyToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não informado.' });
  }
  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ message: 'Token não informado.' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
