const AppError = require('../utils/AppError');
const competitionRepository = require('../repositories/competitionRepository');
const quizRepository = require('../repositories/quizRepository');
const socialRepository = require('../repositories/socialRepository');
const {
  assertMissionWindow,
  getMissionWindowState,
} = require('../utils/missionWindow');

function parsePerguntas(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      throw new AppError('Formato inválido das perguntas do quiz.', 400);
    }
  }
  return [];
}

function validateQuizPerguntas(perguntas) {
  if (!perguntas.length) {
    throw new AppError('O quiz precisa de pelo menos 1 pergunta.', 400);
  }
  for (const [index, pergunta] of perguntas.entries()) {
    if (!pergunta?.enunciado || String(pergunta.enunciado).trim().length < 3) {
      throw new AppError(`Pergunta ${index + 1}: informe o enunciado.`, 400);
    }
    const alternativas = Array.isArray(pergunta.alternativas)
      ? pergunta.alternativas
      : [];
    if (alternativas.length < 2) {
      throw new AppError(
        `Pergunta ${index + 1}: informe pelo menos 2 alternativas.`,
        400
      );
    }
    const corretas = alternativas.filter((alt) => Boolean(alt.correta));
    if (corretas.length !== 1) {
      throw new AppError(
        `Pergunta ${index + 1}: marque exatamente 1 alternativa correta.`,
        400
      );
    }
    for (const alt of alternativas) {
      if (!alt?.texto || !String(alt.texto).trim()) {
        throw new AppError(
          `Pergunta ${index + 1}: todas as alternativas precisam de texto.`,
          400
        );
      }
    }
  }
}

function withWindowMeta(mission) {
  return {
    ...mission,
    janela: getMissionWindowState(mission),
  };
}

async function listMissions(user) {
  await quizRepository.ensureQuizSchema();
  const missions = await competitionRepository.listMissions();
  if (!user?.id) return missions.map(withWindowMeta);

  const quizIds = missions
    .filter((m) => m.tipo === 'QUIZ')
    .map((m) => Number(m.id));
  const mediaIds = missions
    .filter((m) => m.tipo !== 'QUIZ')
    .map((m) => Number(m.id));

  const attempts = await quizRepository.listAttemptsForMissions(
    user.id,
    quizIds
  );
  const submissions = await competitionRepository.listSubmissionsForUser(
    user.id,
    mediaIds
  );

  return missions.map((mission) => {
    const base = withWindowMeta(mission);
    if (mission.tipo === 'QUIZ') {
      const attempt = attempts.get(Number(mission.id));
      const isAdmin = user?.role === 'ADMIN';
      return {
        ...base,
        minha_tentativa: attempt
          ? isAdmin
            ? {
                acertos: attempt.acertos,
                total_perguntas: attempt.total_perguntas,
                pontos_obtidos: attempt.pontos_obtidos,
                duracao_ms: attempt.duracao_ms,
                criado_em: attempt.criado_em,
              }
            : {
                // Participante só sabe que enviou — resultado no feed ao encerrar
                total_perguntas: attempt.total_perguntas,
                duracao_ms: attempt.duracao_ms,
                criado_em: attempt.criado_em,
                enviado: true,
              }
          : null,
      };
    }

    const submission = submissions.get(Number(mission.id));
    return {
      ...base,
      meu_envio: submission
        ? {
            id: submission.id,
            status: submission.status,
            pontuacao_creditada: submission.pontuacao_creditada,
            pontos_obtidos:
              Number(submission.pontuacao_creditada) === 1
                ? Number(mission.pontuacao) || 0
                : 0,
            criado_em: submission.criado_em,
          }
        : null,
    };
  });
}

async function createMission(data) {
  await quizRepository.ensureQuizSchema();
  const allowed = new Set(['FOTO', 'AUDIO', 'VIDEO', 'QUIZ']);
  const tipo = allowed.has(String(data.tipo || '').toUpperCase())
    ? String(data.tipo).toUpperCase()
    : 'FOTO';
  const perguntas = parsePerguntas(data.perguntas);

  if (tipo === 'QUIZ') {
    validateQuizPerguntas(perguntas);
  }

  return competitionRepository.createMission({
    ...data,
    tipo,
    perguntas,
    quiz_modo_pontuacao:
      data.quiz_modo_pontuacao === 'TUDO_OU_NADA'
        ? 'TUDO_OU_NADA'
        : 'PROPORCIONAL',
    quiz_tempo_segundos: data.quiz_tempo_segundos,
    quiz_dificuldade: data.quiz_dificuldade,
  });
}

async function updateMission(id, data) {
  await quizRepository.ensureQuizSchema();
  const existing = await competitionRepository.findMissionById(id);
  if (!existing) throw new AppError('Missão não encontrada.', 404);

  let perguntas = data.perguntas;
  if (typeof perguntas === 'string' && perguntas.trim()) {
    try {
      perguntas = JSON.parse(perguntas);
    } catch (_error) {
      throw new AppError('Formato inválido das perguntas do quiz.', 400);
    }
  }

  if (Array.isArray(perguntas)) {
    if (existing.tipo === 'QUIZ' || data.tipo === 'QUIZ') {
      validateQuizPerguntas(perguntas);
    }
  }

  try {
    return await competitionRepository.updateMission(id, {
      ...data,
      perguntas: Array.isArray(perguntas) ? perguntas : undefined,
      quiz_modo_pontuacao:
        data.quiz_modo_pontuacao === 'TUDO_OU_NADA'
          ? 'TUDO_OU_NADA'
          : data.quiz_modo_pontuacao === 'PROPORCIONAL'
            ? 'PROPORCIONAL'
            : data.quiz_modo_pontuacao,
      quiz_dificuldade: data.quiz_dificuldade,
      quiz_tempo_segundos: data.quiz_tempo_segundos,
    });
  } catch (error) {
    if (error.status) throw new AppError(error.message, error.status);
    throw error;
  }
}

async function deleteMission(id) {
  const existing = await competitionRepository.findMissionById(id);
  if (!existing) throw new AppError('Missão não encontrada.', 404);
  await competitionRepository.deleteMission(id);
  return { ok: true };
}

async function updateMissionStatus(id, status, userId) {
  const mission = await competitionRepository.findMissionById(id);
  if (!mission) throw new AppError('Missão não encontrada.', 404);

  if (status === 'ABERTA' && mission.tipo === 'QUIZ') {
    const perguntas = await quizRepository.getMissionQuestions(id);
    if (!perguntas.length) {
      throw new AppError('Não é possível liberar um quiz sem perguntas.', 400);
    }
  }

  const updated = await competitionRepository.updateMissionStatus(
    id,
    status,
    userId
  );
  if (status === 'ABERTA') {
    await socialRepository.createNotificationForAll({
      titulo: 'Nova missão liberada',
      mensagem: `A missão "${updated.titulo}" já está disponível.`,
      tipo: 'NOVA_MISSAO',
    });
  }
  return updated;
}

async function postMissionToFeed(missionId, adminUser, options = {}) {
  const mission = await competitionRepository.findMissionById(missionId);
  if (!mission) throw new AppError('Missão não encontrada.', 404);

  const existing = await socialRepository.findPostByMissionId(missionId);
  if (existing) {
    throw new AppError('Esta missão já foi publicada no feed.', 409);
  }

  let imagemUrl = options.imagem_url || mission.imagem_capa || null;
  if (!imagemUrl && mission.tipo === 'QUIZ') {
    const perguntas = await quizRepository.getMissionQuestions(missionId);
    const withMedia = perguntas.find((p) => p.midia_url);
    if (withMedia) imagemUrl = withMedia.midia_url;
  }
  if (!imagemUrl) {
    throw new AppError(
      'Adicione uma capa (ou mídia) na missão antes de postar no feed.',
      400
    );
  }

  const encerrar = options.encerrar !== false;
  if (encerrar && mission.status !== 'ENCERRADA') {
    await competitionRepository.updateMissionStatus(
      missionId,
      'ENCERRADA',
      adminUser.id
    );
  }

  let texto = String(options.texto || '').trim();
  if (!texto) {
    const tipoLabel =
      mission.tipo === 'QUIZ'
        ? 'quiz'
        : mission.tipo === 'AUDIO'
          ? 'missão de áudio'
          : mission.tipo === 'VIDEO'
            ? 'missão de vídeo'
            : 'missão';
    texto = `Missão concluída: ${mission.titulo}\n\nA ${tipoLabel} foi encerrada. Confira no feed e comente com o seu time!`;

    if (mission.tipo === 'QUIZ') {
      const perguntas = await quizRepository.getMissionQuestions(missionId, {
        includeCorrect: true,
      });
      if (perguntas.length) {
        const gabarito = perguntas.map((pergunta, index) => {
          const correta =
            pergunta.alternativas?.find((alt) => alt.correta)?.texto || '—';
          return `${index + 1}. ${pergunta.enunciado}\n   Resposta: ${correta}`;
        });
        texto += `\n\nGabarito:\n${gabarito.join('\n')}`;
      }
    }
  }

  const post = await socialRepository.createPost({
    autor_id: adminUser.id,
    equipe_id: adminUser.equipe_id || null,
    imagem_url: imagemUrl,
    texto,
    tipo_publicacao: 'MISSAO_CONCLUIDA',
    missao_id: missionId,
    possui_selo_missao: true,
  });

  await socialRepository.createNotificationForAll({
    titulo: 'Missão no feed',
    mensagem: `A missão "${mission.titulo}" foi publicada no feed. Veja e comente!`,
    tipo: 'NOVA_MISSAO',
  });

  return {
    post,
    mission: await competitionRepository.findMissionById(missionId),
    message: 'Missão publicada no feed e encerrada.',
  };
}

async function submitMission(payload) {
  const mission = await competitionRepository.findMissionById(payload.missao_id);
  if (!mission) throw new AppError('Missão não encontrada.', 404);
  if (mission.tipo === 'QUIZ') {
    throw new AppError('Esta missão é um quiz. Use o envio de respostas.', 400);
  }
  if (mission.status !== 'ABERTA') {
    throw new AppError('Missão não está aberta para envios.', 400);
  }
  assertMissionWindow(mission);

  const expectedByTipo = {
    FOTO: 'IMAGEM',
    AUDIO: 'AUDIO',
    VIDEO: 'VIDEO',
  };
  const expected = expectedByTipo[mission.tipo] || 'IMAGEM';
  if (payload.midia_kind && payload.midia_kind !== expected) {
    throw new AppError(
      `Esta missão exige arquivo do tipo ${mission.tipo.toLowerCase()}.`,
      400
    );
  }

  try {
    const result = await competitionRepository.submitMissionAndCredit({
      missao: mission,
      usuarioId: payload.usuario_id,
      equipeId: payload.equipe_id,
      imagemUrl: payload.imagem_url,
      legenda: payload.legenda,
    });

    return {
      ...result,
      message: `Missão concluída! +${result.pontos_obtidos} ponto(s) para o seu time.`,
    };
  } catch (error) {
    if (error.status) {
      throw new AppError(error.message, error.status);
    }
    if (
      error.code === '23505' ||
      String(error.message || '').includes('já enviou')
    ) {
      throw new AppError('Você já enviou esta missão.', 409);
    }
    throw error;
  }
}

async function getMissionQuiz(missaoId, user) {
  await quizRepository.ensureQuizSchema();
  const mission = await competitionRepository.findMissionById(missaoId);
  if (!mission) throw new AppError('Missão não encontrada.', 404);
  if (mission.tipo !== 'QUIZ') {
    throw new AppError('Esta missão não é um quiz.', 400);
  }

  const isAdmin = user?.role === 'ADMIN';
  const attempt = user?.id
    ? await quizRepository.findAttemptByUser(missaoId, user.id)
    : null;

  // Gabarito nunca vai nas perguntas do participante; admin vê na prévia.
  const includeCorrect = isAdmin;
  const perguntas = await quizRepository.getMissionQuestions(missaoId, {
    includeCorrect,
  });

  let sessao = null;
  let historico = null;
  let ranking = [];

  if (user?.id) {
    if (attempt) {
      historico = await quizRepository.getAttemptHistory(missaoId, user.id);
      if (!isAdmin) {
        historico = quizRepository.sanitizeHistoryForParticipant(historico);
      }
    } else if (mission.status === 'ABERTA' && user.equipe_id) {
      // Sessão (timer) só inicia em startMissionQuiz — aqui só lê se já existir.
      const iniciadoEm = await quizRepository.getQuizSessionStart(missaoId, user.id);
      if (iniciadoEm) {
        sessao = { iniciado_em: iniciadoEm };
      }
    }
    // Ranking do quiz fica no feed quando o admin publica — não no modal do participante.
    if (isAdmin) {
      ranking = await quizRepository.getQuizRanking(missaoId, 15);
    }
  }

  const tempoLimite = Number(mission.quiz_tempo_segundos || 0) || null;
  let tempoRestanteSegundos = null;
  if (sessao?.iniciado_em && tempoLimite) {
    const elapsed = Math.floor(
      (Date.now() - new Date(sessao.iniciado_em).getTime()) / 1000
    );
    tempoRestanteSegundos = Math.max(0, tempoLimite - elapsed);
  }

  return {
    missao: {
      id: mission.id,
      titulo: mission.titulo,
      descricao: mission.descricao,
      pontuacao: mission.pontuacao,
      status: mission.status,
      data_inicio: mission.data_inicio,
      data_fim: mission.data_fim,
      janela: getMissionWindowState(mission),
      quiz_modo_pontuacao: mission.quiz_modo_pontuacao || 'PROPORCIONAL',
      quiz_tempo_segundos: tempoLimite,
      quiz_dificuldade: mission.quiz_dificuldade || 'MEDIO',
    },
    perguntas,
    sessao: sessao
      ? {
          iniciado_em: sessao.iniciado_em,
          tempo_restante_segundos: tempoRestanteSegundos,
        }
      : null,
    minha_tentativa: attempt
      ? isAdmin
        ? {
            id: attempt.id,
            acertos: attempt.acertos,
            total_perguntas: attempt.total_perguntas,
            pontos_obtidos: attempt.pontos_obtidos,
            duracao_ms: attempt.duracao_ms,
            criado_em: attempt.criado_em,
          }
        : {
            id: attempt.id,
            total_perguntas: attempt.total_perguntas,
            duracao_ms: attempt.duracao_ms,
            criado_em: attempt.criado_em,
            enviado: true,
          }
      : null,
    historico,
    ranking,
  };
}

async function startMissionQuiz(missaoId, user) {
  await quizRepository.ensureQuizSchema();
  if (!user?.equipe_id) {
    throw new AppError('Apenas participantes de equipe podem iniciar o quiz.', 403);
  }
  const mission = await competitionRepository.findMissionById(missaoId);
  if (!mission) throw new AppError('Missão não encontrada.', 404);
  if (mission.tipo !== 'QUIZ') {
    throw new AppError('Esta missão não é um quiz.', 400);
  }
  if (mission.status !== 'ABERTA') {
    throw new AppError('Este quiz ainda não está aberto.', 400);
  }
  assertMissionWindow(mission);

  const attempt = await quizRepository.findAttemptByUser(missaoId, user.id);
  if (attempt) {
    throw new AppError('Você já respondeu este quiz.', 409);
  }

  const sessao = await quizRepository.startQuizSession(missaoId, user.id);
  const tempoLimite = Number(mission.quiz_tempo_segundos || 0) || null;
  let tempoRestanteSegundos = null;
  if (sessao?.iniciado_em && tempoLimite) {
    const elapsed = Math.floor(
      (Date.now() - new Date(sessao.iniciado_em).getTime()) / 1000
    );
    tempoRestanteSegundos = Math.max(0, tempoLimite - elapsed);
  }

  return {
    sessao: {
      iniciado_em: sessao.iniciado_em,
      tempo_restante_segundos: tempoRestanteSegundos,
    },
  };
}

async function submitMissionQuiz({ missaoId, user, respostas }) {
  await quizRepository.ensureQuizSchema();
  if (!user?.equipe_id) {
    throw new AppError('Você precisa estar em uma equipe para responder o quiz.', 400);
  }

  const mission = await competitionRepository.findMissionById(missaoId);
  if (!mission) throw new AppError('Missão não encontrada.', 404);
  if (mission.tipo !== 'QUIZ') {
    throw new AppError('Esta missão não é um quiz.', 400);
  }
  if (mission.status !== 'ABERTA') {
    throw new AppError('Quiz não está aberto para respostas.', 400);
  }
  assertMissionWindow(mission);

  try {
    const tentativa = await quizRepository.submitQuizAttempt({
      missao: mission,
      usuarioId: user.id,
      equipeId: user.equipe_id,
      respostas,
    });

    const historicoRaw = await quizRepository.getAttemptHistory(
      missaoId,
      user.id
    );
    const historico = quizRepository.sanitizeHistoryForParticipant(historicoRaw);

    return {
      ok: true,
      total_perguntas: tentativa.total_perguntas,
      duracao_ms: tentativa.duracao_ms,
      historico,
      message:
        'Respostas enviadas! O resultado será uma surpresa quando a missão for encerrada e publicada no feed.',
    };
  } catch (error) {
    if (error.status) {
      throw new AppError(error.message, error.status);
    }
    if (
      error.code === '23505' ||
      String(error.message || '').includes('já respondeu')
    ) {
      throw new AppError('Você já respondeu este quiz.', 409);
    }
    throw error;
  }
}

async function getMissionQuizRanking(missaoId) {
  const mission = await competitionRepository.findMissionById(missaoId);
  if (!mission) throw new AppError('Missão não encontrada.', 404);
  if (mission.tipo !== 'QUIZ') {
    throw new AppError('Esta missão não é um quiz.', 400);
  }
  return quizRepository.getQuizRanking(missaoId, 30);
}

function listMissionSubmissions() {
  return competitionRepository.listMissionSubmissions();
}

async function reviewMissionSubmission(data) {
  const submission = await competitionRepository.findSubmissionById(data.submissionId);
  if (!submission) throw new AppError('Envio não encontrado.', 404);

  const reviewed = await competitionRepository.reviewMissionSubmission(data);
  await socialRepository.createNotificationForTeam(submission.equipe_id, {
    titulo:
      data.status === 'APROVADA' ? 'Missão aprovada' : 'Missão recusada',
    mensagem: `Sua submissão de missão foi ${data.status.toLowerCase()}.`,
    tipo: data.status === 'APROVADA' ? 'MISSAO_APROVADA' : 'MISSAO_RECUSADA',
  });
  return reviewed;
}

function createFoodRecord(data) {
  return competitionRepository.createFoodRecord(data);
}

async function confirmFoodRecord(id, adminId) {
  return competitionRepository.confirmFoodRecord(id, adminId, 1);
}

function listFoodRecords() {
  return competitionRepository.listFoodRecords();
}

function createManualScore(data) {
  return competitionRepository.createManualScore(data);
}

function listScoreHistory() {
  return competitionRepository.listScoreHistory();
}

async function getRanking() {
  const ranking = await competitionRepository.getRanking();
  return ranking;
}

async function getUserMissionRanking() {
  return competitionRepository.getUserMissionRanking(10);
}

module.exports = {
  listMissions,
  createMission,
  updateMission,
  deleteMission,
  updateMissionStatus,
  postMissionToFeed,
  submitMission,
  getMissionQuiz,
  startMissionQuiz,
  submitMissionQuiz,
  getMissionQuizRanking,
  listMissionSubmissions,
  reviewMissionSubmission,
  createFoodRecord,
  confirmFoodRecord,
  listFoodRecords,
  createManualScore,
  listScoreHistory,
  getRanking,
  getUserMissionRanking,
};
