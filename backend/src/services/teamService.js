const teamRepository = require('../repositories/teamRepository');
const { query } = require('../config/db');

function listTeams() {
  return teamRepository.listTeams();
}

function createTeam(data) {
  return teamRepository.createTeam(data);
}

function updateTeam(id, data) {
  return teamRepository.updateTeam(id, data);
}

async function deleteTeam(id) {
  await teamRepository.removeTeam(id);
}

async function ensureDefaultTeams() {
  const defaults = [
    { nome: 'Azul', cor: '#3B82F6' },
    { nome: 'Vermelho', cor: '#EF4444' },
    { nome: 'Amarelo', cor: '#FACC15' },
    { nome: 'Verde', cor: '#22C55E' },
  ];

  for (const team of defaults) {
    const existing = await query('SELECT id FROM equipes WHERE nome = ?', [team.nome]);
    if (existing.length === 0) {
      await teamRepository.createTeam({
        nome: team.nome,
        cor: team.cor,
        descricao: `Equipe ${team.nome}`,
      });
    }
  }

  // Remove equipe Rosa (legado) — mantém apenas as 4 equipes padrão.
  const rosaTeams = await query(
    `SELECT id FROM equipes
     WHERE LOWER(nome) = 'rosa'
        OR LOWER(nome) = 'pink'
        OR LOWER(cor) IN ('#ff00ff', '#ec4899', '#f472b6', '#db2777')`
  );
  for (const team of rosaTeams) {
    await query('UPDATE usuarios SET equipe_id = NULL WHERE equipe_id = ?', [team.id]);
    await teamRepository.removeTeam(team.id);
  }
}

module.exports = {
  listTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  ensureDefaultTeams,
};
