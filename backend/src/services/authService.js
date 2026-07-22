const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const authRepository = require('../repositories/authRepository');
const userRepository = require('../repositories/userRepository');
const passwordResetRepository = require('../repositories/passwordResetRepository');
const { generateToken } = require('../utils/jwt');
const { sendPasswordResetCode } = require('../utils/sendEmail');
const { isValidFullName, normalizeFullName } = require('../utils/fullName');
const { LGPD_VERSION } = require('../constants/lgpd');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) {
    throw new AppError('Telefone é obrigatório.', 400);
  }

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  if (
    (digits.length === 12 || digits.length === 13) &&
    digits.startsWith('55')
  ) {
    return `+${digits}`;
  }

  throw new AppError('Telefone inválido. Informe um número válido com DDD.', 400);
}

async function buildAuthResponse(user) {
  const fullUser = await userRepository.findById(user.id);
  const resolvedUser = fullUser || user;

  const token = generateToken({
    id: resolvedUser.id,
    nome: resolvedUser.nome,
    email: resolvedUser.email,
    role: resolvedUser.role,
    equipe_id: resolvedUser.equipe_id,
  });

  return {
    user: {
      id: resolvedUser.id,
      nome: resolvedUser.nome,
      email: resolvedUser.email,
      telefone: resolvedUser.telefone || null,
      role: resolvedUser.role,
      equipe_id: resolvedUser.equipe_id,
      equipe_nome: resolvedUser.equipe_nome || null,
      foto: resolvedUser.foto || null,
      acessos: resolvedUser.acessos || [],
    },
    token,
  };
}

function isPasswordBypassEnabled() {
  return String(process.env.AUTH_BYPASS_PASSWORD || 'false') === 'true';
}

async function register(data) {
  const email = normalizeEmail(data.email);
  const nome = normalizeFullName(data.nome);
  if (!isValidFullName(nome)) {
    throw new AppError('Informe nome e sobrenome.', 400);
  }
  if (!email) {
    throw new AppError('Email é obrigatório.', 400);
  }
  if (!data.senha || String(data.senha).length < 6) {
    throw new AppError('Senha deve ter pelo menos 6 caracteres.', 400);
  }

  const requiresLgpd = data.requireLgpdAccept === true;
  if (requiresLgpd && data.aceite_lgpd !== true && data.aceite_lgpd !== 'true') {
    throw new AppError(
      'É necessário aceitar o Aviso de Privacidade e LGPD para criar a conta.',
      400
    );
  }

  const normalizedPhone = data.telefone ? normalizePhone(data.telefone) : null;

  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw new AppError('Este email já está em uso.', 409);
  }

  const senhaHash = await bcrypt.hash(data.senha, 10);
  const user = await authRepository.createUser({
    nome,
    email,
    senhaHash,
    role: data.role || 'PARTICIPANTE',
    equipeId: data.equipe_id || null,
    telefone: normalizedPhone,
    lgpdAceitoEm: requiresLgpd ? new Date() : null,
    lgpdVersao: requiresLgpd ? LGPD_VERSION : null,
  });

  return await buildAuthResponse(user);
}

async function signup(data) {
  return register({
    nome: data.nome,
    email: data.email,
    senha: data.senha,
    telefone: data.telefone || null,
    aceite_lgpd: data.aceite_lgpd,
    role: 'PARTICIPANTE',
    equipe_id: null,
    requireLgpdAccept: true,
  });
}

async function login({ email, contato, senha }) {
  const identifier = String(contato || email || '').trim();
  if (!identifier) {
    throw new AppError('Email ou telefone é obrigatório.', 400);
  }

  let user;
  if (identifier.includes('@')) {
    user = await authRepository.findUserByEmail(normalizeEmail(identifier));
  } else {
    let normalizedPhone;
    try {
      normalizedPhone = normalizePhone(identifier);
    } catch (_error) {
      throw new AppError('Email ou telefone inválido.', 400);
    }
    user = await authRepository.findUserByPhone(normalizedPhone);
  }

  if (!user) {
    throw new AppError('Credenciais inválidas.', 401);
  }

  if (!isPasswordBypassEnabled()) {
    if (!senha) {
      throw new AppError('Senha é obrigatória.', 400);
    }
    const isPasswordValid = await bcrypt.compare(
      String(senha),
      String(user.senha_hash || '')
    );
    if (!isPasswordValid) {
      throw new AppError('Credenciais inválidas.', 401);
    }
  }

  return await buildAuthResponse(user);
}

const GENERIC_FORGOT_MESSAGE =
  'Se este e-mail estiver cadastrado, enviamos um código de verificação.';

async function requestPasswordReset({ email }) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    throw new AppError('Informe um e-mail válido.', 400);
  }

  const user = await authRepository.findUserByEmail(normalized);
  if (!user) {
    return { ok: true, message: GENERIC_FORGOT_MESSAGE };
  }

  const reset = await passwordResetRepository.createResetCode({
    usuarioId: user.id,
    email: normalized,
    ttlMinutes: 15,
  });

  await sendPasswordResetCode({
    to: normalized,
    nome: user.nome,
    codigo: reset.codigo,
  });

  return {
    ok: true,
    message: GENERIC_FORGOT_MESSAGE,
    ...(process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY
      ? { devCode: reset.codigo }
      : {}),
  };
}

async function assertValidResetCode(email, codigo) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes('@')) {
    throw new AppError('Informe um e-mail válido.', 400);
  }
  const code = String(codigo || '').trim();
  if (!/^\d{6}$/.test(code)) {
    throw new AppError('Informe o código de 6 dígitos.', 400);
  }

  const active = await passwordResetRepository.findActiveResetByEmail(normalized);
  if (!active) {
    throw new AppError('Código inválido ou expirado. Solicite um novo.', 400);
  }
  if (Number(active.tentativas) >= 5) {
    await passwordResetRepository.markUsed(active.id);
    throw new AppError('Muitas tentativas inválidas. Solicite um novo código.', 429);
  }

  if (!passwordResetRepository.matchesCode(active, code)) {
    await passwordResetRepository.incrementAttempts(active.id);
    throw new AppError('Código inválido.', 400);
  }

  return { normalized, code, active };
}

async function verifyPasswordResetCode({ email, codigo }) {
  await assertValidResetCode(email, codigo);
  return { ok: true, message: 'Código validado. Defina sua nova senha.' };
}

async function resetPasswordWithCode({
  email,
  codigo,
  senhaNova,
  confirmarSenha,
}) {
  if (!senhaNova || String(senhaNova).length < 6) {
    throw new AppError('A nova senha deve ter pelo menos 6 caracteres.', 400);
  }
  if (senhaNova !== confirmarSenha) {
    throw new AppError('A confirmação da nova senha não confere.', 400);
  }

  const { normalized, active } = await assertValidResetCode(email, codigo);

  const senhaHash = await bcrypt.hash(String(senhaNova), 10);
  await userRepository.updatePassword(active.usuario_id, senhaHash);
  await passwordResetRepository.markUsed(active.id);
  await passwordResetRepository.invalidateActiveCodes(normalized);

  return { ok: true, message: 'Senha redefinida com sucesso. Faça login.' };
}

module.exports = {
  register,
  signup,
  login,
  normalizePhone,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPasswordWithCode,
  buildAuthResponse,
};
