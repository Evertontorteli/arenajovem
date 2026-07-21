const { pool, query, queryOn, withTransaction } = require('../config/db');

async function listMissions() {
  const quizRepository = require('./quizRepository');
  await quizRepository.ensureQuizSchema();
  return query(
    `SELECT m.*,
      (SELECT COUNT(*)::int FROM envios_missao em WHERE em.missao_id = m.id) AS total_envios,
      (SELECT COUNT(*)::int FROM missao_perguntas mp WHERE mp.missao_id = m.id) AS total_perguntas,
      (SELECT COUNT(*)::int FROM quiz_tentativas qt WHERE qt.missao_id = m.id) AS total_respostas_quiz
     FROM missoes m
     ORDER BY m.data_inicio DESC`
  );
}

async function createMission(data) {
  const allowed = new Set(['FOTO', 'AUDIO', 'VIDEO', 'QUIZ']);
  const tipo = allowed.has(data.tipo) ? data.tipo : 'FOTO';
  const quizModo =
    data.quiz_modo_pontuacao === 'TUDO_OU_NADA'
      ? 'TUDO_OU_NADA'
      : 'PROPORCIONAL';
  const dificuldadeAllowed = new Set(['FACIL', 'MEDIO', 'DIFICIL', 'MUITO_DIFICIL']);
  const quizDificuldade = dificuldadeAllowed.has(
    String(data.quiz_dificuldade || '').toUpperCase()
  )
    ? String(data.quiz_dificuldade).toUpperCase()
    : 'MEDIO';

  if (tipo === 'QUIZ') {
    const quizRepository = require('./quizRepository');
    await quizRepository.ensureQuizSchema();
    const quizTempo =
      data.quiz_tempo_segundos !== undefined && data.quiz_tempo_segundos !== ''
        ? Math.max(0, Number(data.quiz_tempo_segundos) || 0) || null
        : null;
    return require('../config/db').withTransaction(async (client) => {
      const inserted = await queryOn(
        client,
        `INSERT INTO missoes
          (titulo, descricao, imagem_capa, pontuacao, data_inicio, data_fim, status, liberada_por, tipo, quiz_modo_pontuacao, quiz_tempo_segundos, quiz_dificuldade)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
        [
          data.titulo,
          data.descricao,
          data.imagem_capa || null,
          data.pontuacao,
          data.data_inicio,
          data.data_fim,
          data.status || 'EM_ANALISE',
          data.liberada_por || null,
          tipo,
          quizModo,
          quizTempo,
          quizDificuldade,
        ]
      );
      const missaoId = inserted[0].id;
      await quizRepository.replaceMissionQuestions(
        client,
        missaoId,
        data.perguntas || []
      );
      const rows = await queryOn(client, 'SELECT * FROM missoes WHERE id = ?', [
        missaoId,
      ]);
      return rows[0];
    });
  }

  const inserted = await query(
    `INSERT INTO missoes
      (titulo, descricao, imagem_capa, pontuacao, data_inicio, data_fim, status, liberada_por, tipo, quiz_modo_pontuacao, quiz_tempo_segundos, quiz_dificuldade)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [
      data.titulo,
      data.descricao,
      data.imagem_capa || null,
      data.pontuacao,
      data.data_inicio,
      data.data_fim,
      data.status || 'EM_ANALISE',
      data.liberada_por || null,
      tipo,
      quizModo,
      null,
      null,
    ]
  );
  const rows = await query('SELECT * FROM missoes WHERE id = ?', [inserted[0].id]);
  return rows[0];
}

async function updateMission(id, data) {
  const quizRepository = require('./quizRepository');
  await quizRepository.ensureQuizSchema();

  const dificuldadeAllowed = new Set(['FACIL', 'MEDIO', 'DIFICIL', 'MUITO_DIFICIL']);
  const quizDificuldade = data.quiz_dificuldade
    ? dificuldadeAllowed.has(String(data.quiz_dificuldade).toUpperCase())
      ? String(data.quiz_dificuldade).toUpperCase()
      : null
    : null;
  const quizModo =
    data.quiz_modo_pontuacao === 'TUDO_OU_NADA'
      ? 'TUDO_OU_NADA'
      : data.quiz_modo_pontuacao === 'PROPORCIONAL'
        ? 'PROPORCIONAL'
        : null;
  const hasTempoKey = Object.prototype.hasOwnProperty.call(
    data,
    'quiz_tempo_segundos'
  );
  const quizTempo = hasTempoKey
    ? data.quiz_tempo_segundos === '' || data.quiz_tempo_segundos == null
      ? null
      : Math.max(0, Number(data.quiz_tempo_segundos) || 0) || null
    : undefined;

  const hasPerguntas = Array.isArray(data.perguntas);

  return withTransaction(async (client) => {
    if (hasTempoKey) {
      await queryOn(
        client,
        `UPDATE missoes
         SET titulo = COALESCE(?, titulo),
             descricao = COALESCE(?, descricao),
             imagem_capa = COALESCE(?, imagem_capa),
             pontuacao = COALESCE(?, pontuacao),
             data_inicio = COALESCE(?, data_inicio),
             data_fim = COALESCE(?, data_fim),
             quiz_modo_pontuacao = COALESCE(?, quiz_modo_pontuacao),
             quiz_tempo_segundos = ?,
             quiz_dificuldade = COALESCE(?, quiz_dificuldade)
         WHERE id = ?`,
        [
          data.titulo || null,
          data.descricao || null,
          data.imagem_capa || null,
          data.pontuacao ?? null,
          data.data_inicio || null,
          data.data_fim || null,
          quizModo,
          quizTempo,
          quizDificuldade,
          id,
        ]
      );
    } else {
      await queryOn(
        client,
        `UPDATE missoes
         SET titulo = COALESCE(?, titulo),
             descricao = COALESCE(?, descricao),
             imagem_capa = COALESCE(?, imagem_capa),
             pontuacao = COALESCE(?, pontuacao),
             data_inicio = COALESCE(?, data_inicio),
             data_fim = COALESCE(?, data_fim),
             quiz_modo_pontuacao = COALESCE(?, quiz_modo_pontuacao),
             quiz_dificuldade = COALESCE(?, quiz_dificuldade)
         WHERE id = ?`,
        [
          data.titulo || null,
          data.descricao || null,
          data.imagem_capa || null,
          data.pontuacao ?? null,
          data.data_inicio || null,
          data.data_fim || null,
          quizModo,
          quizDificuldade,
          id,
        ]
      );
    }

    if (hasPerguntas) {
      const attempts = await queryOn(
        client,
        `SELECT COUNT(*)::int AS total FROM quiz_tentativas WHERE missao_id = ?`,
        [id]
      );
      if (Number(attempts[0]?.total || 0) > 0) {
        const err = new Error(
          'Não é possível alterar as perguntas: já existem respostas neste quiz.'
        );
        err.status = 409;
        throw err;
      }
      await quizRepository.replaceMissionQuestions(client, id, data.perguntas);
    }

    const rows = await queryOn(client, 'SELECT * FROM missoes WHERE id = ?', [id]);
    return rows[0];
  });
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
  const inserted = await query(
    `INSERT INTO envios_missao
      (missao_id, usuario_id, equipe_id, imagem_url, legenda, status)
     VALUES (?, ?, ?, ?, ?, 'EM_ANALISE')
     RETURNING id`,
    [data.missao_id, data.usuario_id, data.equipe_id, data.imagem_url, data.legenda]
  );
  const rows = await query('SELECT * FROM envios_missao WHERE id = ?', [inserted[0].id]);
  return rows[0];
}

async function findUserMissionSubmission(missaoId, usuarioId) {
  const rows = await query(
    `SELECT *
     FROM envios_missao
     WHERE missao_id = ? AND usuario_id = ?
     ORDER BY criado_em DESC
     LIMIT 1`,
    [missaoId, usuarioId]
  );
  return rows[0] || null;
}

async function listSubmissionsForUser(usuarioId, missaoIds) {
  if (!usuarioId || !missaoIds?.length) return new Map();
  const placeholders = missaoIds.map(() => '?').join(',');
  const rows = await query(
    `SELECT DISTINCT ON (missao_id)
        missao_id, id, status, pontuacao_creditada, criado_em
     FROM envios_missao
     WHERE usuario_id = ? AND missao_id IN (${placeholders})
     ORDER BY missao_id, criado_em DESC`,
    [usuarioId, ...missaoIds]
  );
  return new Map(rows.map((r) => [Number(r.missao_id), r]));
}

/**
 * Envio com pontuação automática: 1 por usuário/missão, credita na hora.
 */
async function submitMissionAndCredit({
  missao,
  usuarioId,
  equipeId,
  imagemUrl,
  legenda,
}) {
  return withTransaction(async (client) => {
    const existing = await queryOn(
      client,
      `SELECT id FROM envios_missao
       WHERE missao_id = ? AND usuario_id = ?
       FOR UPDATE`,
      [missao.id, usuarioId]
    );
    if (existing[0]) {
      const err = new Error('Você já enviou esta missão.');
      err.status = 409;
      throw err;
    }

    const pontos = Math.max(0, Number(missao.pontuacao) || 0);
    const inserted = await queryOn(
      client,
      `INSERT INTO envios_missao
        (missao_id, usuario_id, equipe_id, imagem_url, legenda, status, pontuacao_creditada, revisado_em)
       VALUES (?, ?, ?, ?, ?, 'APROVADA', 1, NOW())
       RETURNING *`,
      [missao.id, usuarioId, equipeId, imagemUrl, legenda || null]
    );
    const submission = inserted[0];

    if (pontos > 0) {
      await queryOn(
        client,
        `INSERT INTO pontuacoes
          (equipe_id, pontos, tipo, motivo, observacao, referencia_tipo, referencia_id, criado_por)
         VALUES (?, ?, 'ADICAO', 'Missão concluída', ?, 'ENVIO_MISSAO', ?, ?)`,
        [
          equipeId,
          pontos,
          `Pontuação automática (${missao.tipo || 'FOTO'})`,
          submission.id,
          usuarioId,
        ]
      );
      await queryOn(
        client,
        'UPDATE equipes SET pontuacao = pontuacao + ? WHERE id = ?',
        [pontos, equipeId]
      );
    }

    return {
      ...submission,
      pontos_obtidos: pontos,
    };
  });
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const submissions = await queryOn(
      client,
      'SELECT * FROM envios_missao WHERE id = ? FOR UPDATE',
      [submissionId]
    );
    const submission = submissions[0];
    if (!submission) {
      throw new Error('Envio não encontrado.');
    }

    await queryOn(
      client,
      `UPDATE envios_missao
       SET status = ?, observacao_admin = ?, aprovado_por = ?, revisado_em = NOW()
       WHERE id = ?`,
      [status, observacao || null, adminId, submissionId]
    );

    if (status === 'APROVADA' && Number(submission.pontuacao_creditada) === 0) {
      const missaoRows = await queryOn(
        client,
        'SELECT pontuacao FROM missoes WHERE id = ?',
        [submission.missao_id]
      );
      const basePontos = Number(missaoRows[0]?.pontuacao || 0);
      const pontosFinais = Number(pontos ?? basePontos);

      await queryOn(
        client,
        `INSERT INTO pontuacoes (equipe_id, pontos, tipo, motivo, observacao, referencia_tipo, referencia_id, criado_por)
         VALUES (?, ?, 'ADICAO', 'Missão aprovada', ?, 'ENVIO_MISSAO', ?, ?)`,
        [submission.equipe_id, pontosFinais, observacao || null, submissionId, adminId]
      );

      await queryOn(
        client,
        'UPDATE equipes SET pontuacao = pontuacao + ? WHERE id = ?',
        [pontosFinais, submission.equipe_id]
      );

      await queryOn(
        client,
        'UPDATE envios_missao SET pontuacao_creditada = 1 WHERE id = ?',
        [submissionId]
      );
    }

    await client.query('COMMIT');
    const updated = await query('SELECT * FROM envios_missao WHERE id = ?', [
      submissionId,
    ]);
    return updated[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createFoodRecord(data) {
  const inserted = await query(
    `INSERT INTO alimentos (nome, quantidade, equipe_id, status, criado_por)
     VALUES (?, ?, ?, 'PENDENTE', ?)
     RETURNING id`,
    [data.nome, data.quantidade, data.equipe_id, data.criado_por]
  );
  const rows = await query('SELECT * FROM alimentos WHERE id = ?', [inserted[0].id]);
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const foods = await queryOn(
      client,
      'SELECT * FROM alimentos WHERE id = ? FOR UPDATE',
      [id]
    );
    const food = foods[0];
    if (!food) {
      throw new Error('Registro de alimento não encontrado.');
    }

    if (food.status !== 'CONFIRMADO') {
      const pontos = Number(food.quantidade || 0) * Number(pontosPorQuantidade);
      await queryOn(
        client,
        `UPDATE alimentos SET status = 'CONFIRMADO', confirmado_por = ?, confirmado_em = NOW() WHERE id = ?`,
        [adminId, id]
      );
      await queryOn(
        client,
        `INSERT INTO pontuacoes (equipe_id, pontos, tipo, motivo, referencia_tipo, referencia_id, criado_por)
         VALUES (?, ?, 'ADICAO', 'Alimentos confirmados', 'ALIMENTO', ?, ?)`,
        [food.equipe_id, pontos, id, adminId]
      );
      await queryOn(
        client,
        'UPDATE equipes SET pontuacao = pontuacao + ?, alimentos_arrecadados = alimentos_arrecadados + ? WHERE id = ?',
        [pontos, food.quantidade, food.equipe_id]
      );
    }

    await client.query('COMMIT');
    const rows = await query('SELECT * FROM alimentos WHERE id = ?', [id]);
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
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
            DENSE_RANK() OVER (ORDER BY e.pontuacao DESC)::int AS posicao,
            ((SELECT MAX(eq.pontuacao) FROM equipes eq) - e.pontuacao)::int AS diferenca_primeiro
     FROM equipes e
     ORDER BY e.pontuacao DESC, e.nome`
  );
}

/**
 * Top participantes por engajamento (missões, quiz, posts, comentários, curtidas).
 * Sempre considera todos os participantes com equipe e devolve até `limit`.
 */
async function getUserMissionRanking(limit = 10) {
  const safeLimit = Math.min(10, Math.max(1, Number(limit) || 10));
  return query(
    `WITH atividade AS (
       SELECT em.usuario_id,
              COUNT(*)::int AS missoes,
              0::int AS quizzes,
              0::int AS posts,
              0::int AS comentarios,
              0::int AS curtidas,
              MAX(em.criado_em) AS ultimo_em
       FROM envios_missao em
       GROUP BY em.usuario_id
       UNION ALL
       SELECT qt.usuario_id,
              0, COUNT(*)::int, 0, 0, 0,
              MAX(qt.criado_em)
       FROM quiz_tentativas qt
       GROUP BY qt.usuario_id
       UNION ALL
       SELECT p.autor_id,
              0, 0, COUNT(*)::int, 0, 0,
              MAX(p.criado_em)
       FROM publicacoes p
       GROUP BY p.autor_id
       UNION ALL
       SELECT c.usuario_id,
              0, 0, 0, COUNT(*)::int, 0,
              MAX(c.criado_em)
       FROM comentarios c
       GROUP BY c.usuario_id
       UNION ALL
       SELECT cl.usuario_id,
              0, 0, 0, 0, COUNT(*)::int,
              MAX(cl.criado_em)
       FROM curtidas cl
       GROUP BY cl.usuario_id
     ),
     agregado AS (
       SELECT usuario_id,
              SUM(missoes)::int AS missoes,
              SUM(quizzes)::int AS quizzes,
              SUM(posts)::int AS posts,
              SUM(comentarios)::int AS comentarios,
              SUM(curtidas)::int AS curtidas,
              (
                SUM(missoes) * 5
                + SUM(quizzes) * 5
                + SUM(posts) * 3
                + SUM(comentarios) * 2
                + SUM(curtidas)
              )::int AS engajamento,
              MAX(ultimo_em) AS ultimo_em
       FROM atividade
       GROUP BY usuario_id
     ),
     ranked AS (
       SELECT u.id AS usuario_id,
              u.nome AS usuario_nome,
              u.foto AS usuario_foto,
              e.id AS equipe_id,
              e.nome AS equipe_nome,
              COALESCE(a.engajamento, 0)::int AS engajamento,
              COALESCE(a.missoes, 0)::int AS missoes,
              COALESCE(a.quizzes, 0)::int AS quizzes,
              COALESCE(a.posts, 0)::int AS posts,
              COALESCE(a.comentarios, 0)::int AS comentarios,
              COALESCE(a.curtidas, 0)::int AS curtidas,
              ROW_NUMBER() OVER (
                ORDER BY COALESCE(a.engajamento, 0) DESC,
                         COALESCE(a.ultimo_em, u.criado_em) DESC NULLS LAST,
                         u.nome ASC
              )::int AS posicao
       FROM usuarios u
       INNER JOIN equipes e ON e.id = u.equipe_id
       LEFT JOIN agregado a ON a.usuario_id = u.id
       WHERE u.role = 'PARTICIPANTE'
     )
     SELECT *
     FROM ranked
     WHERE posicao <= ?
     ORDER BY posicao ASC`,
    [safeLimit]
  );
}

module.exports = {
  listMissions,
  createMission,
  updateMission,
  deleteMission,
  updateMissionStatus,
  createMissionSubmission,
  findUserMissionSubmission,
  listSubmissionsForUser,
  submitMissionAndCredit,
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
  getUserMissionRanking,
};
