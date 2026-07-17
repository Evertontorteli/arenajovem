const { query } = require('../config/db');

async function findUserByEmail(email) {
  const rows = await query(
    `SELECT u.id, u.nome, u.email, u.telefone, u.google_sub, u.foto, u.senha_hash, u.role, u.equipe_id
     FROM usuarios u
     WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function findUserByPhone(phone) {
  const rows = await query(
    `SELECT u.id, u.nome, u.email, u.telefone, u.google_sub, u.foto, u.senha_hash, u.role, u.equipe_id
     FROM usuarios u
     WHERE u.telefone = ?`,
    [phone]
  );
  return rows[0] || null;
}

async function findUserByGoogleSub(googleSub) {
  const rows = await query(
    `SELECT u.id, u.nome, u.email, u.telefone, u.google_sub, u.foto, u.senha_hash, u.role, u.equipe_id
     FROM usuarios u
     WHERE u.google_sub = ?`,
    [googleSub]
  );
  return rows[0] || null;
}

async function createUser({ nome, email, senhaHash, role, equipeId, telefone, googleSub, foto }) {
  const rows = await query(
    `INSERT INTO usuarios (nome, email, senha_hash, role, equipe_id, telefone, google_sub, foto)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [
      nome,
      email,
      senhaHash,
      role,
      equipeId || null,
      telefone || null,
      googleSub || null,
      foto || null,
    ]
  );

  return {
    id: rows[0].id,
    nome,
    email,
    telefone: telefone || null,
    google_sub: googleSub || null,
    foto: foto || null,
    role,
    equipe_id: equipeId || null,
  };
}

async function updateGoogleIdentity(userId, { googleSub, telefone, foto }) {
  await query(
    `UPDATE usuarios
     SET google_sub = COALESCE(?, google_sub),
         telefone = COALESCE(?, telefone),
         foto = COALESCE(?, foto)
     WHERE id = ?`,
    [googleSub || null, telefone || null, foto || null, userId]
  );

  const rows = await query(
    `SELECT u.id, u.nome, u.email, u.telefone, u.google_sub, u.foto, u.senha_hash, u.role, u.equipe_id
     FROM usuarios u
     WHERE u.id = ?`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  findUserByEmail,
  findUserByPhone,
  findUserByGoogleSub,
  createUser,
  updateGoogleIdentity,
};
