import { brazilDateTimeToUtcMs } from './brazilDateTime';

export function getMissionWindowState(mission, nowMs = Date.now()) {
  const inicio = brazilDateTimeToUtcMs(mission?.data_inicio);
  const fim = brazilDateTimeToUtcMs(mission?.data_fim);

  if (Number.isFinite(inicio) && nowMs < inicio) return 'AINDA_NAO_COMECOU';
  if (Number.isFinite(fim) && nowMs > fim) return 'ENCERRADA_PRAZO';
  return 'NO_PRAZO';
}

export function isMissionOpenForAction(mission) {
  return (
    mission?.status === 'ABERTA' && getMissionWindowState(mission) === 'NO_PRAZO'
  );
}

/** Missões liberadas no prazo que o usuário ainda não concluiu. */
export function countActionableMissions(missions = []) {
  return missions.filter((mission) => {
    if (!isMissionOpenForAction(mission)) return false;
    if (mission.tipo === 'QUIZ') return !mission.minha_tentativa;
    return !mission.meu_envio;
  }).length;
}
