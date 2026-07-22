const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/userRepository');
const {
  getCachedUser,
  setCachedUser,
} = require('../utils/userSessionCache');

function toAuthUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
    equipe_id: user.equipe_id ?? null,
    equipe_nome: user.equipe_nome || null,
    foto: user.foto || null,
  };
}

async function hydrateUser(userId) {
  const cached = getCachedUser(userId);
  if (cached) return toAuthUser(cached);

  const user = await userRepository.findById(userId);
  if (!user) return null;
  setCachedUser(user);
  return toAuthUser(user);
}

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

    const hasEquipeClaim = Object.prototype.hasOwnProperty.call(
      payload,
      'equipe_id'
    );

    // Caminho rápido: JWT completo.
    // Se participante veio com equipe_id null, hidrata (time pode ter sido escolhido depois).
    if (hasEquipeClaim && payload.role) {
      const equipeId = payload.equipe_id ?? null;
      if (payload.role !== 'ADMIN' && !equipeId) {
        const user = await hydrateUser(userId);
        if (!user) {
          return res.status(401).json({ message: 'Usuário não encontrado.' });
        }
        req.user = user;
        return next();
      }

      req.user = {
        id: userId,
        nome: payload.nome,
        email: payload.email,
        role: payload.role,
        equipe_id: equipeId,
        equipe_nome: null,
        foto: null,
      };
      return next();
    }

    // Token antigo / incompleto: hidrata com cache curto.
    const user = await hydrateUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }
    req.user = user;
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
