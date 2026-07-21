export function getMissionWindowState(mission) {
  const now = Date.now();
  const inicio = new Date(mission?.data_inicio).getTime();
  const fim = new Date(mission?.data_fim).getTime();

  if (Number.isFinite(inicio) && now < inicio) return 'AINDA_NAO_COMECOU';
  if (Number.isFinite(fim) && now > fim) return 'ENCERRADA_PRAZO';
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
