const AppError = require('../utils/AppError');
const competitionRepository = require('../repositories/competitionRepository');
const quizRepository = require('../repositories/quizRepository');
const socialRepository = require('../repositories/socialRepository');

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

async function listMissions(user) {
  await quizRepository.ensureQuizSchema();
  const missions = await competitionRepository.listMissions();
  if (!user?.id) return missions;

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
    if (mission.tipo === 'QUIZ') {
      const attempt = attempts.get(Number(mission.id));
      return {
        ...mission,
        minha_tentativa: attempt
          ? {
              acertos: attempt.acertos,
              total_perguntas: attempt.total_perguntas,
              pontos_obtidos: attempt.pontos_obtidos,
              criado_em: attempt.criado_em,
            }
          : null,
      };
    }

    const submission = submissions.get(Number(mission.id));
    return {
      ...mission,
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
  });
}

function updateMission(id, data) {
  return competitionRepository.updateMission(id, data);
}

function deleteMission(id) {
  return competitionRepository.deleteMission(id);
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

async function submitMission(payload) {
  const mission = await competitionRepository.findMissionById(payload.missao_id);
  if (!mission) throw new AppError('Missão não encontrada.', 404);
  if (mission.tipo === 'QUIZ') {
    throw new AppError('Esta missão é um quiz. Use o envio de respostas.', 400);
  }
  if (mission.status !== 'ABERTA') {
    throw new AppError('Missão não está aberta para envios.', 400);
  }

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

  const perguntas = await quizRepository.getMissionQuestions(missaoId, {
    includeCorrect: isAdmin,
  });

  return {
    missao: {
      id: mission.id,
      titulo: mission.titulo,
      descricao: mission.descricao,
      pontuacao: mission.pontuacao,
      status: mission.status,
      quiz_modo_pontuacao: mission.quiz_modo_pontuacao || 'PROPORCIONAL',
    },
    perguntas,
    minha_tentativa: attempt
      ? {
          id: attempt.id,
          acertos: attempt.acertos,
          total_perguntas: attempt.total_perguntas,
          pontos_obtidos: attempt.pontos_obtidos,
          criado_em: attempt.criado_em,
        }
      : null,
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

  try {
    const tentativa = await quizRepository.submitQuizAttempt({
      missao: mission,
      usuarioId: user.id,
      equipeId: user.equipe_id,
      respostas,
    });

    return {
      ok: true,
      acertos: tentativa.acertos,
      total_perguntas: tentativa.total_perguntas,
      pontos_obtidos: tentativa.pontos_obtidos,
      message: `Você acertou ${tentativa.acertos} de ${tentativa.total_perguntas} e somou ${tentativa.pontos_obtidos} ponto(s) para o seu time.`,
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

module.exports = {
  listMissions,
  createMission,
  updateMission,
  deleteMission,
  updateMissionStatus,
  submitMission,
  getMissionQuiz,
  submitMissionQuiz,
  listMissionSubmissions,
  reviewMissionSubmission,
  createFoodRecord,
  confirmFoodRecord,
  listFoodRecords,
  createManualScore,
  listScoreHistory,
  getRanking,
};
