const asyncHandler = require('../utils/asyncHandler');
const competitionService = require('../services/competitionService');
const AppError = require('../utils/AppError');
const { persistUpload } = require('../utils/persistUpload');

const listMissions = asyncHandler(async (_req, res) => {
  const missions = await competitionService.listMissions();
  res.json(missions);
});

const createMission = asyncHandler(async (req, res) => {
  const imagemCapa = req.file
    ? await persistUpload(req.file, 'missions')
    : req.body.imagem_capa || null;
  const mission = await competitionService.createMission({
    ...req.body,
    imagem_capa: imagemCapa,
    liberada_por: req.user.id,
  });
  res.status(201).json(mission);
});

const updateMission = asyncHandler(async (req, res) => {
  const imagemCapa = req.file
    ? await persistUpload(req.file, 'missions')
    : req.body.imagem_capa;
  const mission = await competitionService.updateMission(req.params.id, {
    ...req.body,
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

const submitMission = asyncHandler(async (req, res) => {
  if (!req.user.equipe_id) {
    throw new AppError('Você precisa estar em uma equipe para enviar missão.', 400);
  }
  if (!req.file) {
    throw new AppError('Selecione uma imagem para o envio.', 400);
  }
  const imagemUrl = await persistUpload(req.file, 'mission-submissions');
  const submission = await competitionService.submitMission({
    missao_id: req.params.id,
    usuario_id: req.user.id,
    equipe_id: req.user.equipe_id,
    imagem_url: imagemUrl,
    legenda: req.body.legenda,
  });
  res.status(201).json(submission);
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

module.exports = {
  listMissions,
  createMission,
  updateMission,
  deleteMission,
  updateMissionStatus,
  submitMission,
  listMissionSubmissions,
  reviewMissionSubmission,
  createFoodRecord,
  listFoodRecords,
  confirmFoodRecord,
  createManualScore,
  listScoreHistory,
  getRanking,
};
