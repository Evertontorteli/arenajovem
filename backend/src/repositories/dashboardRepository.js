const { query } = require('../config/db');

async function getAdminMetrics() {
  const [usuarios] = await query('SELECT COUNT(*) AS total FROM usuarios');
  const [equipes] = await query('SELECT COUNT(*) AS total FROM equipes');
  const [missoes] = await query('SELECT COUNT(*) AS total FROM missoes');
  const [publicacoes] = await query('SELECT COUNT(*) AS total FROM publicacoes');
  const [curtidas] = await query('SELECT COUNT(*) AS total FROM curtidas');
  const [comentarios] = await query('SELECT COUNT(*) AS total FROM comentarios');
  const ranking = await query(
    'SELECT id, nome, pontuacao FROM equipes ORDER BY pontuacao DESC, nome'
  );

  return {
    totalParticipantes: usuarios.total,
    totalEquipes: equipes.total,
    totalDesafios: missoes.total,
    publicacoes: publicacoes.total,
    curtidas: curtidas.total,
    comentarios: comentarios.total,
    ranking,
  };
}

async function getUserDashboardData(userId) {
  const [usuario] = await query(
    `SELECT u.id, u.nome, u.equipe_id, e.nome AS equipe_nome, e.pontuacao
     FROM usuarios u
     LEFT JOIN equipes e ON e.id = u.equipe_id
     WHERE u.id = ?`,
    [userId]
  );

  const ranking = await query(
    `SELECT id, nome, pontuacao,
            DENSE_RANK() OVER (ORDER BY pontuacao DESC) AS posicao
     FROM equipes
     ORDER BY pontuacao DESC, nome`
  );
  const ultimasMissoes = await query(
    'SELECT * FROM missoes ORDER BY data_inicio DESC LIMIT 5'
  );
  const feed = await query(
    'SELECT * FROM publicacoes ORDER BY criado_em DESC LIMIT 8'
  );
  const proximasAtividades = await query(
    `SELECT id, titulo, data_inicio, data_fim
     FROM missoes
     WHERE data_inicio >= CURDATE()
     ORDER BY data_inicio ASC
     LIMIT 5`
  );

  return {
    usuario,
    ranking,
    ultimasMissoes,
    feed,
    proximasAtividades,
  };
}

module.exports = {
  getAdminMetrics,
  getUserDashboardData,
};
