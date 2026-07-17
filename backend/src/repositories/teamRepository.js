const { query } = require('../config/db');

async function listTeams() {
  return query(
    `SELECT e.*,
      (SELECT COUNT(*) FROM usuarios u WHERE u.equipe_id = e.id) AS participantes
     FROM equipes e
     ORDER BY e.pontuacao DESC, e.nome`
  );
}

async function findTeamById(id) {
  const rows = await query('SELECT * FROM equipes WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createTeam(data) {
  const result = await query(
    `INSERT INTO equipes
      (nome, cor, escudo_url, foto_url, descricao, alimentos_arrecadados, pontuacao)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      data.nome,
      data.cor,
      data.escudo_url || null,
      data.foto_url || null,
      data.descricao || null,
      data.alimentos_arrecadados || 0,
    ]
  );
  return findTeamById(result.insertId);
}

async function updateTeam(id, data) {
  await query(
    `UPDATE equipes
     SET nome = COALESCE(?, nome),
         cor = COALESCE(?, cor),
         escudo_url = COALESCE(?, escudo_url),
         foto_url = COALESCE(?, foto_url),
         descricao = COALESCE(?, descricao),
         alimentos_arrecadados = COALESCE(?, alimentos_arrecadados)
     WHERE id = ?`,
    [
      data.nome || null,
      data.cor || null,
      data.escudo_url || null,
      data.foto_url || null,
      data.descricao || null,
      data.alimentos_arrecadados ?? null,
      id,
    ]
  );
  return findTeamById(id);
}

async function removeTeam(id) {
  await query('DELETE FROM equipes WHERE id = ?', [id]);
}

module.exports = {
  listTeams,
  findTeamById,
  createTeam,
  updateTeam,
  removeTeam,
};
