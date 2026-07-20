const { query } = require('../config/db');
const accessProfileService = require('../services/accessProfileService');

function formatUser(row) {
  if (!row) return null;
  const acessos = accessProfileService.resolveAccessForRole(row.role);
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    role: row.role,
    foto: row.foto,
    equipe_id: row.equipe_id,
    equipe_nome: row.equipe_nome,
    acessos,
  };
}

async function findById(id) {
  const rows = await query(
    `SELECT u.id, u.nome, u.email, u.telefone, u.role, u.foto, u.equipe_id, e.nome AS equipe_nome
     FROM usuarios u
     LEFT JOIN equipes e ON e.id = u.equipe_id
     WHERE u.id = ?`,
    [id]
  );
  return formatUser(rows[0] || null);
}

async function listUsers() {
  const rows = await query(
    `SELECT u.id, u.nome, u.email, u.telefone, u.role, u.foto, u.equipe_id, e.nome AS equipe_nome
     FROM usuarios u
     LEFT JOIN equipes e ON e.id = u.equipe_id
     ORDER BY u.nome`
  );
  return rows.map(formatUser);
}

async function updateProfile(id, data) {
  await query(
    `UPDATE usuarios
     SET nome = COALESCE(?, nome),
         foto = COALESCE(?, foto),
         telefone = COALESCE(?, telefone)
     WHERE id = ?`,
    [data.nome || null, data.foto || null, data.telefone || null, id]
  );
  return findById(id);
}

async function updateUserTeam(id, equipeId) {
  await query('UPDATE usuarios SET equipe_id = ? WHERE id = ?', [equipeId, id]);
  return findById(id);
}

async function updateUserAccess(id, { role, equipeId }) {
  const fields = [];
  const params = [];

  if (role) {
    fields.push('role = ?');
    params.push(role);
  }

  if (equipeId !== undefined) {
    fields.push('equipe_id = ?');
    params.push(equipeId);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  params.push(id);
  await query(
    `UPDATE usuarios
     SET ${fields.join(', ')}
     WHERE id = ?`,
    params
  );
  return findById(id);
}

async function findAuthById(id) {
  const rows = await query(
    `SELECT id, senha_hash
     FROM usuarios
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function updatePassword(id, senhaHash) {
  await query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [senhaHash, id]);
}

async function countAdmins() {
  const rows = await query("SELECT COUNT(*) AS total FROM usuarios WHERE role = 'ADMIN'");
  return Number(rows[0]?.total || 0);
}

module.exports = {
  findById,
  findAuthById,
  listUsers,
  updateProfile,
  updatePassword,
  updateUserTeam,
  updateUserAccess,
  countAdmins,
};
