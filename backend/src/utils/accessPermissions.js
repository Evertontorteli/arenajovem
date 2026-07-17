const ACCESS_MODULES = {
  dashboard: 'Dashboard',
  equipes: 'Equipes',
  missoes: 'Missões',
  feed: 'Feed',
  ranking: 'Ranking Ao Vivo',
  noticias: 'Notícias',
  perfil: 'Perfil',
  admin_pontuacao: 'Pontuação (Admin)',
  admin_acessos: 'Acessos (Admin)',
};

const ADMIN_ONLY_MODULES = ['dashboard', 'equipes', 'admin_pontuacao', 'admin_acessos'];

const PARTICIPANTE_DEFAULT = ['missoes', 'feed', 'ranking', 'noticias', 'perfil'];
const ADMIN_DEFAULT = Object.keys(ACCESS_MODULES);

function parseStoredAccess(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_error) {
      return null;
    }
  }
  return null;
}

function getDefaultAccessByRole(role) {
  return role === 'ADMIN' ? [...ADMIN_DEFAULT] : [...PARTICIPANTE_DEFAULT];
}

function sanitizeAccessList(acessos, role) {
  const unique = [...new Set(acessos)].filter((key) => ACCESS_MODULES[key]);
  return unique.length > 0 ? unique : getDefaultAccessByRole(role);
}

function resolveUserAccess(user, profileMap) {
  if (profileMap && user?.role && profileMap[user.role]) {
    return sanitizeAccessList(profileMap[user.role], user.role);
  }

  const stored = parseStoredAccess(user?.acessos);
  if (stored && stored.length > 0) {
    return sanitizeAccessList(stored, user.role);
  }
  return getDefaultAccessByRole(user?.role || 'PARTICIPANTE');
}

function validateAccessPayload(acessos, role) {
  if (!Array.isArray(acessos)) {
    throw new Error('Lista de acessos inválida.');
  }
  const sanitized = sanitizeAccessList(acessos, role);
  if (sanitized.length === 0) {
    throw new Error('Selecione ao menos uma aba de acesso.');
  }
  return sanitized;
}

module.exports = {
  ACCESS_MODULES,
  ADMIN_ONLY_MODULES,
  PARTICIPANTE_DEFAULT,
  ADMIN_DEFAULT,
  getDefaultAccessByRole,
  parseStoredAccess,
  sanitizeAccessList,
  resolveUserAccess,
  validateAccessPayload,
};
