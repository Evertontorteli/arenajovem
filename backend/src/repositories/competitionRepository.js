const { pool, query } = require('../config/db');

async function executeOn(db, sql, values = []) {
  const [rows] = await db.execute(sql, values);
  return rows;
}

async function listMissions() {
  return query(
    `SELECT m.*,
      (SELECT COUNT(*) FROM envios_missao em WHERE em.missao_id = m.id) AS total_envios
     FROM missoes m
     ORDER BY m.data_inicio DESC`
  );
}

async function createMission(data) {
  const result = await query(
    `INSERT INTO missoes
      (titulo, descricao, imagem_capa, pontuacao, data_inicio, data_fim, status, liberada_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.titulo,
      data.descricao,
      data.imagem_capa || null,
      data.pontuacao,
      data.data_inicio,
      data.data_fim,
      data.status || 'EM_ANALISE',
      data.liberada_por || null,
    ]
  );
  const rows = await query('SELECT * FROM missoes WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function updateMission(id, data) {
  await query(
    `UPDATE missoes
     SET titulo = COALESCE(?, titulo),
         descricao = COALESCE(?, descricao),
         imagem_capa = COALESCE(?, imagem_capa),
         pontuacao = COALESCE(?, pontuacao),
         data_inicio = COALESCE(?, data_inicio),
         data_fim = COALESCE(?, data_fim)
     WHERE id = ?`,
    [
      data.titulo || null,
      data.descricao || null,
      data.imagem_capa || null,
      data.pontuacao ?? null,
      data.data_inicio || null,
      data.data_fim || null,
      id,
    ]
  );
  const rows = await query('SELECT * FROM missoes WHERE id = ?', [id]);
  return rows[0];
}

async function deleteMission(id) {
  await query('DELETE FROM missoes WHERE id = ?', [id]);
}

async function updateMissionStatus(id, status, userId) {
  await query(
    `UPDATE missoes
     SET status = ?, liberada_por = ?, liberada_em = NOW()
     WHERE id = ?`,
    [status, userId, id]
  );
  const rows = await query('SELECT * FROM missoes WHERE id = ?', [id]);
  return rows[0];
}

async function createMissionSubmission(data) {
  const result = await query(
    `INSERT INTO envios_missao
      (missao_id, usuario_id, equipe_id, imagem_url, legenda, status)
     VALUES (?, ?, ?, ?, ?, 'EM_ANALISE')`,
    [data.missao_id, data.usuario_id, data.equipe_id, data.imagem_url, data.legenda]
  );
  const rows = await query('SELECT * FROM envios_missao WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function listMissionSubmissions() {
  return query(
    `SELECT em.*, m.titulo AS missao_titulo, u.nome AS autor_nome, e.nome AS equipe_nome
     FROM envios_missao em
     INNER JOIN missoes m ON m.id = em.missao_id
     INNER JOIN usuarios u ON u.id = em.usuario_id
     INNER JOIN equipes e ON e.id = em.equipe_id
     ORDER BY em.criado_em DESC`
  );
}

async function findSubmissionById(id) {
  const rows = await query('SELECT * FROM envios_missao WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findMissionById(id) {
  const rows = await query('SELECT * FROM missoes WHERE id = ?', [id]);
  return rows[0] || null;
}

async function reviewMissionSubmission({
  submissionId,
  status,
  observacao,
  pontos,
  adminId,
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const submissions = await executeOn(
      connection,
      'SELECT * FROM envios_missao WHERE id = ? FOR UPDATE',
      [submissionId]
    );
    const submission = submissions[0];
    if (!submission) {
      throw new Error('Envio não encontrado.');
    }

    await executeOn(
      connection,
      `UPDATE envios_missao
       SET status = ?, observacao_admin = ?, aprovado_por = ?, revisado_em = NOW()
       WHERE id = ?`,
      [status, observacao || null, adminId, submissionId]
    );

    if (status === 'APROVADA' && submission.pontuacao_creditada === 0) {
      const missaoRows = await executeOn(
        connection,
        'SELECT pontuacao FROM missoes WHERE id = ?',
        [submission.missao_id]
      );
      const basePontos = Number(missaoRows[0]?.pontuacao || 0);
      const pontosFinais = Number(pontos ?? basePontos);

      await executeOn(
        connection,
        `INSERT INTO pontuacoes (equipe_id, pontos, tipo, motivo, observacao, referencia_tipo, referencia_id, criado_por)
         VALUES (?, ?, 'ADICAO', 'Missão aprovada', ?, 'ENVIO_MISSAO', ?, ?)`,
        [submission.equipe_id, pontosFinais, observacao || null, submissionId, adminId]
      );

      await executeOn(
        connection,
        'UPDATE equipes SET pontuacao = pontuacao + ? WHERE id = ?',
        [pontosFinais, submission.equipe_id]
      );

      await executeOn(
        connection,
        'UPDATE envios_missao SET pontuacao_creditada = 1 WHERE id = ?',
        [submissionId]
      );
    }

    await connection.commit();
    const updated = await query('SELECT * FROM envios_missao WHERE id = ?', [
      submissionId,
    ]);
    return updated[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createFoodRecord(data) {
  const result = await query(
    `INSERT INTO alimentos (nome, quantidade, equipe_id, status, criado_por)
     VALUES (?, ?, ?, 'PENDENTE', ?)`,
    [data.nome, data.quantidade, data.equipe_id, data.criado_por]
  );
  const rows = await query('SELECT * FROM alimentos WHERE id = ?', [result.insertId]);
  return rows[0];
}

async function listFoodRecords() {
  return query(
    `SELECT a.*, e.nome AS equipe_nome
     FROM alimentos a
     INNER JOIN equipes e ON e.id = a.equipe_id
     ORDER BY a.criado_em DESC`
  );
}

async function confirmFoodRecord(id, adminId, pontosPorQuantidade = 1) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const foods = await executeOn(
      connection,
      'SELECT * FROM alimentos WHERE id = ? FOR UPDATE',
      [id]
    );
    const food = foods[0];
    if (!food) {
      throw new Error('Registro de alimento não encontrado.');
    }

    if (food.status !== 'CONFIRMADO') {
      const pontos = Number(food.quantidade || 0) * Number(pontosPorQuantidade);
      await executeOn(
        connection,
        'UPDATE alimentos SET status = "CONFIRMADO", confirmado_por = ?, confirmado_em = NOW() WHERE id = ?',
        [adminId, id]
      );
      await executeOn(
        connection,
        `INSERT INTO pontuacoes (equipe_id, pontos, tipo, motivo, referencia_tipo, referencia_id, criado_por)
         VALUES (?, ?, 'ADICAO', 'Alimentos confirmados', 'ALIMENTO', ?, ?)`,
        [food.equipe_id, pontos, id, adminId]
      );
      await executeOn(
        connection,
        'UPDATE equipes SET pontuacao = pontuacao + ?, alimentos_arrecadados = alimentos_arrecadados + ? WHERE id = ?',
        [pontos, food.quantidade, food.equipe_id]
      );
    }

    await connection.commit();
    const rows = await query('SELECT * FROM alimentos WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createManualScore(data) {
  const pontosAjustados = data.tipo === 'REMOCAO' ? -Math.abs(data.pontos) : Math.abs(data.pontos);

  await query(
    `INSERT INTO pontuacoes
      (equipe_id, pontos, tipo, motivo, observacao, referencia_tipo, criado_por)
     VALUES (?, ?, ?, ?, ?, 'MANUAL', ?)`,
    [
      data.equipe_id,
      pontosAjustados,
      data.tipo,
      data.motivo,
      data.observacao || null,
      data.criado_por,
    ]
  );

  await query('UPDATE equipes SET pontuacao = pontuacao + ? WHERE id = ?', [
    pontosAjustados,
    data.equipe_id,
  ]);

  return { equipe_id: data.equipe_id, pontos: pontosAjustados };
}

async function listScoreHistory() {
  return query(
    `SELECT p.*, e.nome AS equipe_nome, u.nome AS criado_por_nome
     FROM pontuacoes p
     INNER JOIN equipes e ON e.id = p.equipe_id
     LEFT JOIN usuarios u ON u.id = p.criado_por
     ORDER BY p.criado_em DESC`
  );
}

async function getRanking() {
  return query(
    `SELECT e.id, e.nome, e.cor, e.escudo_url, e.pontuacao,
            DENSE_RANK() OVER (ORDER BY e.pontuacao DESC) AS posicao,
            (SELECT MAX(eq.pontuacao) FROM equipes eq) - e.pontuacao AS diferenca_primeiro
     FROM equipes e
     ORDER BY e.pontuacao DESC, e.nome`
  );
}

module.exports = {
  listMissions,
  createMission,
  updateMission,
  deleteMission,
  updateMissionStatus,
  createMissionSubmission,
  listMissionSubmissions,
  findSubmissionById,
  findMissionById,
  reviewMissionSubmission,
  createFoodRecord,
  listFoodRecords,
  confirmFoodRecord,
  createManualScore,
  listScoreHistory,
  getRanking,
};
