const { query } = require('../config/db');

const PROFILE_KEYS = {
  PARTICIPANTE: 'acesso_perfil_participante',
  ADMIN: 'acesso_perfil_admin',
};

async function getConfigValue(key) {
  const rows = await query('SELECT valor FROM configuracoes WHERE chave = ?', [key]);
  return rows[0]?.valor || null;
}

async function setConfigValue(key, value) {
  await query(
    `INSERT INTO configuracoes (chave, valor)
     VALUES (?, ?)
     ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = NOW()`,
    [key, value]
  );
}

async function getProfileAccess(role) {
  const key = PROFILE_KEYS[role];
  if (!key) return null;
  return getConfigValue(key);
}

async function setProfileAccess(role, acessosJson) {
  const key = PROFILE_KEYS[role];
  if (!key) return null;
  await setConfigValue(key, acessosJson);
  return getProfileAccess(role);
}

async function getAllProfileAccess() {
  const [participante, admin] = await Promise.all([
    getProfileAccess('PARTICIPANTE'),
    getProfileAccess('ADMIN'),
  ]);
  return {
    PARTICIPANTE: participante,
    ADMIN: admin,
  };
}

module.exports = {
  PROFILE_KEYS,
  getConfigValue,
  setConfigValue,
  getProfileAccess,
  setProfileAccess,
  getAllProfileAccess,
};
