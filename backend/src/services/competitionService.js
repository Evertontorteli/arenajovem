const AppError = require('../utils/AppError');
const competitionRepository = require('../repositories/competitionRepository');
const socialRepository = require('../repositories/socialRepository');

function listMissions() {
  return competitionRepository.listMissions();
}

function createMission(data) {
  return competitionRepository.createMission(data);
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

  const updated = await competitionRepository.updateMissionStatus(id, status, userId);
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
  if (mission.status !== 'ABERTA') {
    throw new AppError('Missão não está aberta para envios.', 400);
  }
  return competitionRepository.createMissionSubmission(payload);
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
  listMissionSubmissions,
  reviewMissionSubmission,
  createFoodRecord,
  confirmFoodRecord,
  listFoodRecords,
  createManualScore,
  listScoreHistory,
  getRanking,
};
