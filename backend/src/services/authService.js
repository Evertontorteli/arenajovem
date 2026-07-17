const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');
const authRepository = require('../repositories/authRepository');
const userRepository = require('../repositories/userRepository');
const { generateToken } = require('../utils/jwt');

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
  if (!data.nome || String(data.nome).trim().length < 2) {
    throw new AppError('Nome inválido.', 400);
  }
  if (!email) {
    throw new AppError('Email é obrigatório.', 400);
  }
  if (!data.senha || String(data.senha).length < 6) {
    throw new AppError('Senha deve ter pelo menos 6 caracteres.', 400);
  }
  const normalizedPhone = data.telefone ? normalizePhone(data.telefone) : null;

  const existing = await authRepository.findUserByEmail(email);
  if (existing) {
    throw new AppError('Este email já está em uso.', 409);
  }

  const senhaHash = await bcrypt.hash(data.senha, 10);
  const user = await authRepository.createUser({
    nome: String(data.nome).trim(),
    email,
    senhaHash,
    role: data.role || 'PARTICIPANTE',
    equipeId: data.equipe_id || null,
    telefone: normalizedPhone,
  });

  return await buildAuthResponse(user);
}

async function signup(data) {
  return register({
    nome: data.nome,
    email: data.email,
    senha: data.senha,
    telefone: data.telefone || null,
    role: 'PARTICIPANTE',
    equipe_id: null,
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

module.exports = {
  register,
  signup,
  login,
  normalizePhone,
};
