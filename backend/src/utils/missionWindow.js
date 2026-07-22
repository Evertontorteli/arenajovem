const AppError = require('./AppError');
const {
  brazilDateTimeToUtcMs,
  nowBrazilUtcMs,
} = require('./brazilDateTime');

function getMissionWindowState(mission, nowMs = nowBrazilUtcMs()) {
  const inicio = brazilDateTimeToUtcMs(mission?.data_inicio);
  const fim = brazilDateTimeToUtcMs(mission?.data_fim);

  if (Number.isFinite(inicio) && nowMs < inicio) return 'AINDA_NAO_COMECOU';
  if (Number.isFinite(fim) && nowMs > fim) return 'ENCERRADA_PRAZO';
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
