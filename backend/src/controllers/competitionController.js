const asyncHandler = require('../utils/asyncHandler');
const competitionService = require('../services/competitionService');
const AppError = require('../utils/AppError');
const { persistMedia } = require('../utils/persistUpload');

function pickFile(files, fieldname) {
  if (!Array.isArray(files)) return null;
  return files.find((file) => file.fieldname === fieldname) || null;
}

const listMissions = asyncHandler(async (req, res) => {
  const [missions, engajados] = await Promise.all([
    competitionService.listMissions(req.user),
    competitionService.getUserMissionRanking().catch(() => []),
  ]);
  res.json({ missions, engajados });
});

const createMission = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const capaFile = pickFile(files, 'imagem_capa') || req.file || null;
  const imagemCapa = capaFile
    ? (await persistMedia(capaFile)).url
    : req.body.imagem_capa || null;

  let perguntas = req.body.perguntas;
  if (typeof perguntas === 'string' && perguntas.trim()) {
    try {
      perguntas = JSON.parse(perguntas);
    } catch (_error) {
      throw new AppError('Formato inválido das perguntas do quiz.', 400);
    }
  }
  if (Array.isArray(perguntas)) {
    for (let i = 0; i < perguntas.length; i += 1) {
      const midiaFile = pickFile(files, `pergunta_midia_${i}`);
      if (!midiaFile) continue;
      const saved = await persistMedia(midiaFile);
      perguntas[i] = {
        ...perguntas[i],
        midia_url: saved.url,
        midia_tipo: saved.kind,
      };
    }
  }

  const mission = await competitionService.createMission({
    ...req.body,
    perguntas,
    imagem_capa: imagemCapa,
    liberada_por: req.user.id,
  });
  res.status(201).json(mission);
});

const updateMission = asyncHandler(async (req, res) => {
  const files = req.files || [];
  const capaFile = pickFile(files, 'imagem_capa') || req.file || null;
  const imagemCapa = capaFile
    ? (await persistMedia(capaFile)).url
    : req.body.imagem_capa || undefined;

  let perguntas = req.body.perguntas;
  if (typeof perguntas === 'string' && perguntas.trim()) {
    try {
      perguntas = JSON.parse(perguntas);
    } catch (_error) {
      throw new AppError('Formato inválido das perguntas do quiz.', 400);
    }
  }
  if (Array.isArray(perguntas)) {
    for (let i = 0; i < perguntas.length; i += 1) {
      const midiaFile = pickFile(files, `pergunta_midia_${i}`);
      if (midiaFile) {
        const saved = await persistMedia(midiaFile);
        perguntas[i] = {
          ...perguntas[i],
          midia_url: saved.url,
          midia_tipo: saved.kind,
        };
      }
    }
  }

  const mission = await competitionService.updateMission(req.params.id, {
    ...req.body,
    perguntas: Array.isArray(perguntas) ? perguntas : undefined,
    imagem_capa: imagemCapa,
  });
  res.json(mission);
});

const deleteMission = asyncHandler(async (req, res) => {
  await competitionService.deleteMission(req.params.id);
  res.status(204).send();
});

const updateMissionStatus = asyncHandler(async (req, res) => {
  const mission = await competitionService.updateMissionStatus(
    req.params.id,
    req.body.status,
    req.user.id
  );
  res.json(mission);
});

const postMissionToFeed = asyncHandler(async (req, res) => {
  const result = await competitionService.postMissionToFeed(
    req.params.id,
    req.user,
    {
      texto: req.body.texto,
      encerrar: req.body.encerrar,
      imagem_url: req.body.imagem_url,
    }
  );
  res.status(201).json(result);
});

const submitMission = asyncHandler(async (req, res) => {
  if (!req.user.equipe_id) {
    throw new AppError('Você precisa estar em uma equipe para enviar missão.', 400);
  }
  const file = req.file || pickFile(req.files || [], 'imagem') || pickFile(req.files || [], 'midia');
  if (!file) {
    throw new AppError('Selecione um arquivo para o envio.', 400);
  }
  const saved = await persistMedia(file);
  const submission = await competitionService.submitMission({
    missao_id: req.params.id,
    usuario_id: req.user.id,
    equipe_id: req.user.equipe_id,
    imagem_url: saved.url,
    midia_kind: saved.kind,
    legenda: req.body.legenda,
  });
  res.status(201).json(submission);
});

const getMissionQuiz = asyncHandler(async (req, res) => {
  const quiz = await competitionService.getMissionQuiz(req.params.id, req.user);
  res.json(quiz);
});

const startMissionQuiz = asyncHandler(async (req, res) => {
  const result = await competitionService.startMissionQuiz(req.params.id, req.user);
  res.json(result);
});

const submitMissionQuiz = asyncHandler(async (req, res) => {
  const result = await competitionService.submitMissionQuiz({
    missaoId: req.params.id,
    user: req.user,
    respostas: req.body.respostas,
  });
  res.status(201).json(result);
});

const getMissionQuizRanking = asyncHandler(async (req, res) => {
  const ranking = await competitionService.getMissionQuizRanking(req.params.id);
  res.json(ranking);
});

const listMissionSubmissions = asyncHandler(async (_req, res) => {
  const submissions = await competitionService.listMissionSubmissions();
  res.json(submissions);
});

const reviewMissionSubmission = asyncHandler(async (req, res) => {
  const reviewed = await competitionService.reviewMissionSubmission({
    submissionId: req.params.id,
    status: req.body.status,
    observacao: req.body.observacao,
    pontos: req.body.pontos,
    adminId: req.user.id,
  });
  res.json(reviewed);
});

const createFoodRecord = asyncHandler(async (req, res) => {
  const requestedTeamId = req.body.equipe_id;
  const teamId =
    req.user.role === 'ADMIN'
      ? requestedTeamId || req.user.equipe_id
      : req.user.equipe_id;

  if (!teamId) {
    throw new AppError('Equipe não definida para registrar alimentos.', 400);
  }

  const food = await competitionService.createFoodRecord({
    ...req.body,
    criado_por: req.user.id,
    equipe_id: teamId,
  });
  res.status(201).json(food);
});

const listFoodRecords = asyncHandler(async (_req, res) => {
  const foods = await competitionService.listFoodRecords();
  res.json(foods);
});

const confirmFoodRecord = asyncHandler(async (req, res) => {
  const food = await competitionService.confirmFoodRecord(req.params.id, req.user.id);
  res.json(food);
});

const createManualScore = asyncHandler(async (req, res) => {
  const score = await competitionService.createManualScore({
    ...req.body,
    criado_por: req.user.id,
  });
  res.status(201).json(score);
});

const listScoreHistory = asyncHandler(async (_req, res) => {
  const history = await competitionService.listScoreHistory();
  res.json(history);
});

const getRanking = asyncHandler(async (_req, res) => {
  const ranking = await competitionService.getRanking();
  res.json(ranking);
});

const getUserMissionRanking = asyncHandler(async (_req, res) => {
  const ranking = await competitionService.getUserMissionRanking();
  res.json(ranking);
});

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
  listFoodRecords,
  confirmFoodRecord,
  createManualScore,
  listScoreHistory,
  getRanking,
  getUserMissionRanking,
};
