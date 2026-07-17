const AppError = require('../utils/AppError');
const accessProfileRepository = require('../repositories/accessProfileRepository');
const {
  PARTICIPANTE_DEFAULT,
  ADMIN_DEFAULT,
  getDefaultAccessByRole,
  parseStoredAccess,
  sanitizeAccessList,
  validateAccessPayload,
} = require('../utils/accessPermissions');

let cachedProfiles = null;

function getCachedProfiles() {
  if (!cachedProfiles) {
    return {
      PARTICIPANTE: [...PARTICIPANTE_DEFAULT],
      ADMIN: [...ADMIN_DEFAULT],
    };
  }
  return cachedProfiles;
}

function parseProfileValue(raw, role) {
  const stored = parseStoredAccess(raw);
  if (stored && stored.length > 0) {
    return sanitizeAccessList(stored, role);
  }
  return getDefaultAccessByRole(role);
}

async function loadProfiles() {
  const raw = await accessProfileRepository.getAllProfileAccess();
  cachedProfiles = {
    PARTICIPANTE: parseProfileValue(raw.PARTICIPANTE, 'PARTICIPANTE'),
    ADMIN: parseProfileValue(raw.ADMIN, 'ADMIN'),
  };
  return cachedProfiles;
}

async function ensureDefaultProfiles() {
  const raw = await accessProfileRepository.getAllProfileAccess();

  if (!raw.PARTICIPANTE) {
    await accessProfileRepository.setProfileAccess(
      'PARTICIPANTE',
      JSON.stringify(PARTICIPANTE_DEFAULT)
    );
  }

  if (!raw.ADMIN) {
    await accessProfileRepository.setProfileAccess('ADMIN', JSON.stringify(ADMIN_DEFAULT));
  }

  return loadProfiles();
}

async function listProfiles() {
  const profiles = await loadProfiles();
  return profiles;
}

async function updateProfile(role, acessos) {
  if (!['PARTICIPANTE', 'ADMIN'].includes(role)) {
    throw new AppError('Perfil inválido.', 400);
  }

  let sanitized;
  try {
    sanitized = validateAccessPayload(acessos, role);
  } catch (error) {
    throw new AppError(error.message, 400);
  }

  await accessProfileRepository.setProfileAccess(role, JSON.stringify(sanitized));
  await loadProfiles();

  return {
    role,
    acessos: sanitized,
  };
}

function resolveAccessForRole(role) {
  const profiles = getCachedProfiles();
  return sanitizeAccessList(profiles[role] || getDefaultAccessByRole(role), role);
}

module.exports = {
  ensureDefaultProfiles,
  listProfiles,
  updateProfile,
  resolveAccessForRole,
  loadProfiles,
};
