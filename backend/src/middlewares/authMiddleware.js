const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');

async function requireAuth(req, res, next) {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não informado.' });
  }
  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ message: 'Token não informado.' });
  }

  try {
    const payload = verifyToken(token);
    const userId = Number(payload?.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    // Dados atuais do banco (equipe pode ter sido escolhida após o login).
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }

    req.user = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      equipe_id: user.equipe_id,
      equipe_nome: user.equipe_nome || null,
      foto: user.foto || null,
    };
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
