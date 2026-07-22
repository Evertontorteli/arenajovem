const AppError = require('../utils/AppError');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const teamRepository = require('../repositories/teamRepository');
const { normalizePhone } = require('./authService');
const { isValidFullName, normalizeFullName } = require('../utils/fullName');

async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('Usuário não encontrado.', 404);
  return user;
}

function listUsers() {
  return userRepository.listUsers();
}

async function updateProfile(userId, data) {
  const payload = { ...data };
  if (Object.prototype.hasOwnProperty.call(payload, 'nome')) {
    const nome = normalizeFullName(payload.nome);
    if (!isValidFullName(nome)) {
      throw new AppError('Informe nome e sobrenome.', 400);
    }
    payload.nome = nome;
  }
  if (payload.telefone) {
    payload.telefone = normalizePhone(payload.telefone);
  }
  return userRepository.updateProfile(userId, payload);
}

async function changePassword(userId, { senhaAtual, senhaNova, confirmarSenha }) {
  if (!senhaAtual) {
    throw new AppError('Informe a senha atual.', 400);
  }
  if (!senhaNova || String(senhaNova).length < 6) {
    throw new AppError('A nova senha deve ter pelo menos 6 caracteres.', 400);
  }
  if (senhaNova !== confirmarSenha) {
    throw new AppError('A confirmação da nova senha não confere.', 400);
  }
  if (senhaAtual === senhaNova) {
    throw new AppError('A nova senha deve ser diferente da senha atual.', 400);
  }

  const authUser = await userRepository.findAuthById(userId);
  if (!authUser) {
    throw new AppError('Usuário não encontrado.', 404);
  }

  const isValid = await bcrypt.compare(
    String(senhaAtual),
    String(authUser.senha_hash || '')
  );
  if (!isValid) {
    throw new AppError('Senha atual incorreta.', 401);
  }

  const senhaHash = await bcrypt.hash(String(senhaNova), 10);
  await userRepository.updatePassword(userId, senhaHash);

  return { ok: true, message: 'Senha alterada com sucesso.' };
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

  const user = await userRepository.updateUserTeam(userId, parsedTeamId);
  const { invalidateCachedUser } = require('../utils/userSessionCache');
  invalidateCachedUser(userId);
  return user;
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

async function deleteMyAccount(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('Usuário não encontrado.', 404);

  if (user.role === 'ADMIN') {
    const adminCount = await userRepository.countAdmins();
    if (adminCount <= 1) {
      throw new AppError(
        'Não é possível apagar a conta do último administrador.',
        400
      );
    }
  }

  await userRepository.deleteById(userId);
  return { ok: true, message: 'Conta apagada com sucesso.' };
}

module.exports = {
  getMe,
  listUsers,
  updateProfile,
  changePassword,
  updateTeam,
  updateAccess,
  deleteMyAccount,
};
