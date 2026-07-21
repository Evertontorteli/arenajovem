const { pool, query, queryOn, withTransaction } = require('../config/db');

let ensured = false;

async function ensureQuizSchema() {
  if (ensured) return;

  await query(`
    ALTER TABLE missoes
      ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'FOTO'
  `);
  await query(`ALTER TABLE missoes DROP CONSTRAINT IF EXISTS missoes_tipo_check`);
  await query(`
    ALTER TABLE missoes
      ADD CONSTRAINT missoes_tipo_check
      CHECK (tipo IN ('FOTO', 'AUDIO', 'VIDEO', 'QUIZ'))
  `);
  await query(`
    ALTER TABLE missoes
      ADD COLUMN IF NOT EXISTS quiz_modo_pontuacao VARCHAR(20) NOT NULL DEFAULT 'PROPORCIONAL'
  `);
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'missoes_quiz_modo_check'
      ) THEN
        ALTER TABLE missoes
          ADD CONSTRAINT missoes_quiz_modo_check
          CHECK (quiz_modo_pontuacao IN ('PROPORCIONAL', 'TUDO_OU_NADA'));
      END IF;
    END $$;
  `);

  await query(`
    ALTER TABLE missoes
      ADD COLUMN IF NOT EXISTS quiz_tempo_segundos INT
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS missao_perguntas (
      id SERIAL PRIMARY KEY,
      missao_id INT NOT NULL REFERENCES missoes(id) ON DELETE CASCADE,
      enunciado TEXT NOT NULL,
      ordem INT NOT NULL DEFAULT 0,
      midia_url TEXT,
      midia_tipo VARCHAR(20),
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
    ALTER TABLE missao_perguntas
      ADD COLUMN IF NOT EXISTS midia_url TEXT
  `);
  await query(`
    ALTER TABLE missao_perguntas
      ADD COLUMN IF NOT EXISTS midia_tipo VARCHAR(20)
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS missao_alternativas (
      id SERIAL PRIMARY KEY,
      pergunta_id INT NOT NULL REFERENCES missao_perguntas(id) ON DELETE CASCADE,
      texto TEXT NOT NULL,
      correta SMALLINT NOT NULL DEFAULT 0,
      ordem INT NOT NULL DEFAULT 0
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS quiz_tentativas (
      id SERIAL PRIMARY KEY,
      missao_id INT NOT NULL REFERENCES missoes(id) ON DELETE CASCADE,
      usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      equipe_id INT NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
      acertos INT NOT NULL DEFAULT 0,
      total_perguntas INT NOT NULL DEFAULT 0,
      pontos_obtidos INT NOT NULL DEFAULT 0,
      iniciado_em TIMESTAMP,
      duracao_ms INT,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (missao_id, usuario_id)
    )
  `);
  await query(`
    ALTER TABLE quiz_tentativas
      ADD COLUMN IF NOT EXISTS iniciado_em TIMESTAMP
  `);
  await query(`
    ALTER TABLE quiz_tentativas
      ADD COLUMN IF NOT EXISTS duracao_ms INT
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS quiz_inicios (
      missao_id INT NOT NULL REFERENCES missoes(id) ON DELETE CASCADE,
      usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      iniciado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (missao_id, usuario_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS quiz_respostas (
      id SERIAL PRIMARY KEY,
      tentativa_id INT NOT NULL REFERENCES quiz_tentativas(id) ON DELETE CASCADE,
      pergunta_id INT NOT NULL REFERENCES missao_perguntas(id) ON DELETE CASCADE,
      alternativa_id INT NOT NULL REFERENCES missao_alternativas(id) ON DELETE CASCADE,
      correta SMALLINT NOT NULL DEFAULT 0,
      UNIQUE (tentativa_id, pergunta_id)
    )
  `);

  try {
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_envios_missao_usuario
        ON envios_missao (missao_id, usuario_id)
    `);
  } catch (_error) {
    // Pode falhar se já existirem envios duplicados legados.
  }

  await query(`
    CREATE INDEX IF NOT EXISTS idx_missao_perguntas_missao
      ON missao_perguntas (missao_id, ordem)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_quiz_tentativas_missao
      ON quiz_tentativas (missao_id)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_quiz_tentativas_ranking
      ON quiz_tentativas (missao_id, pontos_obtidos DESC, duracao_ms ASC)
  `);

  ensured = true;
}

function calcQuizPoints({
  modo,
  pontuacaoMissao,
  acertos,
  totalPerguntas,
}) {
  const total = Math.max(0, Number(totalPerguntas) || 0);
  const hits = Math.max(0, Math.min(Number(acertos) || 0, total));
  const base = Math.max(0, Number(pontuacaoMissao) || 0);

  if (total === 0 || base === 0) return 0;
  if (modo === 'TUDO_OU_NADA') {
    return hits === total ? base : 0;
  }
  // PROPORCIONAL: arredonda para baixo para evitar inflar pontos
  return Math.floor((base * hits) / total);
}

async function replaceMissionQuestions(client, missaoId, perguntas) {
  await queryOn(client, 'DELETE FROM missao_perguntas WHERE missao_id = ?', [
    missaoId,
  ]);

  for (let i = 0; i < perguntas.length; i += 1) {
    const pergunta = perguntas[i];
    const midiaTipo = ['AUDIO', 'VIDEO', 'IMAGEM'].includes(pergunta.midia_tipo)
      ? pergunta.midia_tipo
      : null;
    const midiaUrl = pergunta.midia_url ? String(pergunta.midia_url) : null;
    const inserted = await queryOn(
      client,
      `INSERT INTO missao_perguntas
        (missao_id, enunciado, ordem, midia_url, midia_tipo)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`,
      [
        missaoId,
        String(pergunta.enunciado).trim(),
        i,
        midiaUrl,
        midiaUrl ? midiaTipo : null,
      ]
    );
    const perguntaId = inserted[0].id;
    const alternativas = Array.isArray(pergunta.alternativas)
      ? pergunta.alternativas
      : [];

    for (let j = 0; j < alternativas.length; j += 1) {
      const alt = alternativas[j];
      await queryOn(
        client,
        `INSERT INTO missao_alternativas (pergunta_id, texto, correta, ordem)
         VALUES (?, ?, ?, ?)`,
        [
          perguntaId,
          String(alt.texto).trim(),
          alt.correta ? 1 : 0,
          j,
        ]
      );
    }
  }
}

async function getMissionQuestions(missaoId, { includeCorrect = false } = {}) {
  await ensureQuizSchema();
  const perguntas = await query(
    `SELECT id, enunciado, ordem, midia_url, midia_tipo
     FROM missao_perguntas
     WHERE missao_id = ?
     ORDER BY ordem ASC, id ASC`,
    [missaoId]
  );

  if (!perguntas.length) return [];

  const ids = perguntas.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const alternativas = await query(
    `SELECT id, pergunta_id, texto, ordem${includeCorrect ? ', correta' : ''}
     FROM missao_alternativas
     WHERE pergunta_id IN (${placeholders})
     ORDER BY ordem ASC, id ASC`,
    ids
  );

  const byPergunta = new Map();
  for (const alt of alternativas) {
    if (!byPergunta.has(alt.pergunta_id)) byPergunta.set(alt.pergunta_id, []);
    const item = {
      id: alt.id,
      texto: alt.texto,
      ordem: alt.ordem,
    };
    if (includeCorrect) item.correta = Number(alt.correta) === 1;
    byPergunta.get(alt.pergunta_id).push(item);
  }

  return perguntas.map((p) => ({
    id: p.id,
    enunciado: p.enunciado,
    ordem: p.ordem,
    midia_url: p.midia_url || null,
    midia_tipo: p.midia_tipo || null,
    alternativas: byPergunta.get(p.id) || [],
  }));
}

async function findAttemptByUser(missaoId, usuarioId) {
  await ensureQuizSchema();
  const rows = await query(
    `SELECT *
     FROM quiz_tentativas
     WHERE missao_id = ? AND usuario_id = ?
     LIMIT 1`,
    [missaoId, usuarioId]
  );
  return rows[0] || null;
}

async function listAttemptsForMissions(usuarioId, missaoIds) {
  if (!usuarioId || !missaoIds?.length) return new Map();
  await ensureQuizSchema();
  const placeholders = missaoIds.map(() => '?').join(',');
  const rows = await query(
    `SELECT missao_id, acertos, total_perguntas, pontos_obtidos, duracao_ms, criado_em
     FROM quiz_tentativas
     WHERE usuario_id = ? AND missao_id IN (${placeholders})`,
    [usuarioId, ...missaoIds]
  );
  return new Map(rows.map((r) => [Number(r.missao_id), r]));
}

async function startQuizSession(missaoId, usuarioId) {
  await ensureQuizSchema();
  const existingAttempt = await findAttemptByUser(missaoId, usuarioId);
  if (existingAttempt) {
    return {
      ja_respondido: true,
      iniciado_em: existingAttempt.iniciado_em || existingAttempt.criado_em,
    };
  }

  const rows = await query(
    `INSERT INTO quiz_inicios (missao_id, usuario_id, iniciado_em)
     VALUES (?, ?, NOW())
     ON CONFLICT (missao_id, usuario_id)
     DO UPDATE SET missao_id = EXCLUDED.missao_id
     RETURNING iniciado_em`,
    [missaoId, usuarioId]
  );
  return {
    ja_respondido: false,
    iniciado_em: rows[0].iniciado_em,
  };
}

async function getQuizSessionStart(missaoId, usuarioId) {
  await ensureQuizSchema();
  const rows = await query(
    `SELECT iniciado_em FROM quiz_inicios
     WHERE missao_id = ? AND usuario_id = ?
     LIMIT 1`,
    [missaoId, usuarioId]
  );
  return rows[0]?.iniciado_em || null;
}

async function getAttemptHistory(missaoId, usuarioId) {
  await ensureQuizSchema();
  const attempt = await findAttemptByUser(missaoId, usuarioId);
  if (!attempt) return null;

  const respostas = await query(
    `SELECT
        qr.pergunta_id,
        qr.alternativa_id,
        qr.correta AS acertou,
        mp.enunciado,
        mp.ordem,
        mp.midia_url,
        mp.midia_tipo,
        escolhida.texto AS resposta_escolhida,
        correta.texto AS resposta_correta
     FROM quiz_respostas qr
     INNER JOIN missao_perguntas mp ON mp.id = qr.pergunta_id
     INNER JOIN missao_alternativas escolhida ON escolhida.id = qr.alternativa_id
     INNER JOIN missao_alternativas correta
       ON correta.pergunta_id = qr.pergunta_id AND correta.correta = 1
     WHERE qr.tentativa_id = ?
     ORDER BY mp.ordem ASC, mp.id ASC`,
    [attempt.id]
  );

  return {
    tentativa: {
      id: attempt.id,
      acertos: attempt.acertos,
      total_perguntas: attempt.total_perguntas,
      pontos_obtidos: attempt.pontos_obtidos,
      duracao_ms: attempt.duracao_ms,
      criado_em: attempt.criado_em,
    },
    itens: respostas.map((row) => ({
      pergunta_id: row.pergunta_id,
      enunciado: row.enunciado,
      midia_url: row.midia_url,
      midia_tipo: row.midia_tipo,
      acertou: Number(row.acertou) === 1,
      resposta_escolhida: row.resposta_escolhida,
      // Gabarito só depois de responder
      resposta_correta: row.resposta_correta,
    })),
  };
}

async function getQuizRanking(missaoId, limit = 20) {
  await ensureQuizSchema();
  return query(
    `SELECT
        qt.usuario_id,
        u.nome AS usuario_nome,
        e.nome AS equipe_nome,
        qt.acertos,
        qt.total_perguntas,
        qt.pontos_obtidos,
        qt.duracao_ms,
        qt.criado_em,
        DENSE_RANK() OVER (
          ORDER BY qt.pontos_obtidos DESC,
                   COALESCE(qt.duracao_ms, 2147483647) ASC,
                   qt.criado_em ASC
        )::int AS posicao
     FROM quiz_tentativas qt
     INNER JOIN usuarios u ON u.id = qt.usuario_id
     INNER JOIN equipes e ON e.id = qt.equipe_id
     WHERE qt.missao_id = ?
     ORDER BY posicao ASC, qt.criado_em ASC
     LIMIT ?`,
    [missaoId, Math.min(50, Math.max(1, Number(limit) || 20))]
  );
}

async function submitQuizAttempt({
  missao,
  usuarioId,
  equipeId,
  respostas,
}) {
  await ensureQuizSchema();

  return withTransaction(async (client) => {
    const existing = await queryOn(
      client,
      `SELECT id FROM quiz_tentativas
       WHERE missao_id = ? AND usuario_id = ?
       FOR UPDATE`,
      [missao.id, usuarioId]
    );
    if (existing[0]) {
      const err = new Error('Você já respondeu este quiz.');
      err.status = 409;
      throw err;
    }

    const inicioRows = await queryOn(
      client,
      `SELECT iniciado_em FROM quiz_inicios
       WHERE missao_id = ? AND usuario_id = ?
       FOR UPDATE`,
      [missao.id, usuarioId]
    );
    let iniciadoEm = inicioRows[0]?.iniciado_em
      ? new Date(inicioRows[0].iniciado_em)
      : null;
    if (!iniciadoEm) {
      iniciadoEm = new Date();
      await queryOn(
        client,
        `INSERT INTO quiz_inicios (missao_id, usuario_id, iniciado_em)
         VALUES (?, ?, ?)
         ON CONFLICT (missao_id, usuario_id) DO NOTHING`,
        [missao.id, usuarioId, iniciadoEm.toISOString()]
      );
    }

    const agora = new Date();
    const duracaoMs = Math.max(0, agora.getTime() - iniciadoEm.getTime());
    const tempoLimite = Number(missao.quiz_tempo_segundos || 0);
    if (tempoLimite > 0) {
      const graceMs = 3000;
      if (duracaoMs > tempoLimite * 1000 + graceMs) {
        const err = new Error(
          `Tempo esgotado. Limite de ${tempoLimite} segundos.`
        );
        err.status = 400;
        throw err;
      }
    }

    const perguntas = await queryOn(
      client,
      `SELECT id FROM missao_perguntas
       WHERE missao_id = ?
       ORDER BY ordem ASC, id ASC`,
      [missao.id]
    );
    if (!perguntas.length) {
      const err = new Error('Este quiz ainda não tem perguntas.');
      err.status = 400;
      throw err;
    }

    const perguntaIds = perguntas.map((p) => p.id);
    const placeholders = perguntaIds.map(() => '?').join(',');
    const alternativas = await queryOn(
      client,
      `SELECT id, pergunta_id, correta
       FROM missao_alternativas
       WHERE pergunta_id IN (${placeholders})`,
      perguntaIds
    );

    const altById = new Map(alternativas.map((a) => [Number(a.id), a]));
    const answerByPergunta = new Map();
    for (const resposta of respostas || []) {
      const perguntaId = Number(resposta.pergunta_id);
      const alternativaId = Number(resposta.alternativa_id);
      if (!perguntaId || !alternativaId) continue;
      answerByPergunta.set(perguntaId, alternativaId);
    }

    let acertos = 0;
    const graded = [];

    for (const pergunta of perguntas) {
      const alternativaId = answerByPergunta.get(Number(pergunta.id));
      if (!alternativaId) {
        const err = new Error('Responda todas as perguntas do quiz.');
        err.status = 400;
        throw err;
      }
      const alt = altById.get(alternativaId);
      if (!alt || Number(alt.pergunta_id) !== Number(pergunta.id)) {
        const err = new Error('Alternativa inválida para uma das perguntas.');
        err.status = 400;
        throw err;
      }
      const correta = Number(alt.correta) === 1 ? 1 : 0;
      if (correta) acertos += 1;
      graded.push({
        pergunta_id: pergunta.id,
        alternativa_id: alternativaId,
        correta,
      });
    }

    const pontos = calcQuizPoints({
      modo: missao.quiz_modo_pontuacao || 'PROPORCIONAL',
      pontuacaoMissao: missao.pontuacao,
      acertos,
      totalPerguntas: perguntas.length,
    });

    const tentativaRows = await queryOn(
      client,
      `INSERT INTO quiz_tentativas
        (missao_id, usuario_id, equipe_id, acertos, total_perguntas, pontos_obtidos, iniciado_em, duracao_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
      [
        missao.id,
        usuarioId,
        equipeId,
        acertos,
        perguntas.length,
        pontos,
        iniciadoEm.toISOString(),
        duracaoMs,
      ]
    );
    const tentativa = tentativaRows[0];

    for (const item of graded) {
      await queryOn(
        client,
        `INSERT INTO quiz_respostas
          (tentativa_id, pergunta_id, alternativa_id, correta)
         VALUES (?, ?, ?, ?)`,
        [tentativa.id, item.pergunta_id, item.alternativa_id, item.correta]
      );
    }

    if (pontos > 0) {
      await queryOn(
        client,
        `INSERT INTO pontuacoes
          (equipe_id, pontos, tipo, motivo, observacao, referencia_tipo, referencia_id, criado_por)
         VALUES (?, ?, 'ADICAO', 'Quiz de missão', ?, 'QUIZ_MISSAO', ?, ?)`,
        [
          equipeId,
          pontos,
          `${acertos}/${perguntas.length} acertos · ${Math.round(duracaoMs / 1000)}s`,
          tentativa.id,
          usuarioId,
        ]
      );
      await queryOn(
        client,
        'UPDATE equipes SET pontuacao = pontuacao + ? WHERE id = ?',
        [pontos, equipeId]
      );
    }

    return tentativa;
  });
}

module.exports = {
  ensureQuizSchema,
  calcQuizPoints,
  replaceMissionQuestions,
  getMissionQuestions,
  findAttemptByUser,
  listAttemptsForMissions,
  startQuizSession,
  getQuizSessionStart,
  getAttemptHistory,
  getQuizRanking,
  submitQuizAttempt,
};
