const AppError = require('../utils/AppError');
const userRepository = require('../repositories/userRepository');
const teamRepository = require('../repositories/teamRepository');
const { normalizePhone } = require('./authService');

async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('Usuário não encontrado.', 404);
  return user;
}

function listUsers() {
  return userRepository.listUsers();
}

async function updateProfile(userId, data) {
  if (data.telefone) {
    data.telefone = normalizePhone(data.telefone);
  }
  return userRepository.updateProfile(userId, data);
}

async function updateTeam(userId, equipeId) {
  const parsedTeamId = Number(equipeId);
  if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
    throw new AppError('Equipe inválida.', 400);
  }

  const team = await teamRepository.findTeamById(parsedTeamId);
  if (!team) {
    throw new AppError('Equipe não encontrada.', 404);
  }

  return userRepository.updateUserTeam(userId, parsedTeamId);
}

async function updateAccess(actorUserId, targetUserId, data) {
  const parsedTargetId = Number(targetUserId);
  if (!Number.isInteger(parsedTargetId) || parsedTargetId <= 0) {
    throw new AppError('Usuário inválido.', 400);
  }

  const targetUser = await userRepository.findById(parsedTargetId);
  if (!targetUser) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  let role;
  if (Object.prototype.hasOwnProperty.call(data, 'role')) {
    if (!['ADMIN', 'PARTICIPANTE'].includes(data.role)) {
      throw new AppError('Perfil de acesso inválido.', 400);
    }
    role = data.role;
  }

  let equipeId;
  if (Object.prototype.hasOwnProperty.call(data, 'equipe_id')) {
    if (data.equipe_id === null || data.equipe_id === '') {
      equipeId = null;
    } else {
      const parsedTeamId = Number(data.equipe_id);
      if (!Number.isInteger(parsedTeamId) || parsedTeamId <= 0) {
        throw new AppError('Equipe inválida.', 400);
      }
      const team = await teamRepository.findTeamById(parsedTeamId);
      if (!team) {
        throw new AppError('Equipe não encontrada.', 404);
      }
      equipeId = parsedTeamId;
    }
  }

  if (
    role === 'PARTICIPANTE' &&
    Number(actorUserId) === parsedTargetId &&
    targetUser.role === 'ADMIN'
  ) {
    const adminCount = await userRepository.countAdmins();
    if (adminCount <= 1) {
      throw new AppError('Não é possível remover o último administrador.', 400);
    }
  }

  return userRepository.updateUserAccess(parsedTargetId, {
    role,
    equipeId,
  });
}

module.exports = {
  getMe,
  listUsers,
  updateProfile,
  updateTeam,
  updateAccess,
};
