const AppError = require('./AppError');

function getMissionWindowState(mission) {
  const now = Date.now();
  const inicio = new Date(mission?.data_inicio).getTime();
  const fim = new Date(mission?.data_fim).getTime();

  if (Number.isFinite(inicio) && now < inicio) return 'AINDA_NAO_COMECOU';
  if (Number.isFinite(fim) && now > fim) return 'ENCERRADA_PRAZO';
  return 'NO_PRAZO';
}

function assertMissionWindow(mission) {
  const state = getMissionWindowState(mission);
  if (state === 'AINDA_NAO_COMECOU') {
    throw new AppError('Esta missão ainda não começou.', 400);
  }
  if (state === 'ENCERRADA_PRAZO') {
    throw new AppError('O prazo desta missão já encerrou.', 400);
  }
}

module.exports = {
  getMissionWindowState,
  assertMissionWindow,
};
