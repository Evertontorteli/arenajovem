const TEAM_ORDER = ['AMARELO', 'AZUL', 'VERMELHO', 'VERDE'];

const TEAM_STYLE_BY_KEY = {
  AMARELO: { bg: 'bg-yellow-500', ring: 'ring-yellow-200' },
  AZUL: { bg: 'bg-blue-500', ring: 'ring-blue-200' },
  VERMELHO: { bg: 'bg-red-500', ring: 'ring-red-200' },
  VERDE: { bg: 'bg-green-500', ring: 'ring-green-200' },
};

const TEAM_THEME_BY_KEY = {
  AMARELO: {
    element: 'Raio',
    softBg: 'bg-yellow-100',
    softText: 'text-yellow-700',
    border: 'border-yellow-200',
    gradient: 'from-yellow-50 via-white to-amber-50',
    glow: 'shadow-yellow-100',
  },
  AZUL: {
    element: 'Água',
    softBg: 'bg-blue-100',
    softText: 'text-blue-700',
    border: 'border-blue-200',
    gradient: 'from-blue-50 via-white to-sky-50',
    glow: 'shadow-blue-100',
  },
  VERDE: {
    element: 'Planta',
    softBg: 'bg-green-100',
    softText: 'text-green-700',
    border: 'border-green-200',
    gradient: 'from-green-50 via-white to-emerald-50',
    glow: 'shadow-green-100',
  },
  VERMELHO: {
    element: 'Fogo',
    softBg: 'bg-red-100',
    softText: 'text-red-700',
    border: 'border-red-200',
    gradient: 'from-red-50 via-white to-orange-50',
    glow: 'shadow-red-100',
  },
};

function normalizeLabel(value = '') {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function detectTeamKey(teamLabel) {
  const label = normalizeLabel(teamLabel);
  if (label.includes('amarelo')) return 'AMARELO';
  if (label.includes('azul')) return 'AZUL';
  if (label.includes('vermelho')) return 'VERMELHO';
  if (label.includes('verde')) return 'VERDE';
  return null;
}

export function getTeamStylesByLabel(teamLabel, fallbackKey = 'AMARELO') {
  const key = detectTeamKey(teamLabel) || fallbackKey;
  return TEAM_STYLE_BY_KEY[key] || TEAM_STYLE_BY_KEY.AMARELO;
}

export function getTeamThemeByLabel(teamLabel, fallbackKey = 'AMARELO') {
  const key = detectTeamKey(teamLabel) || fallbackKey;
  const styles = TEAM_STYLE_BY_KEY[key] || TEAM_STYLE_BY_KEY.AMARELO;
  const theme = TEAM_THEME_BY_KEY[key] || TEAM_THEME_BY_KEY.AMARELO;
  return { key, ...styles, ...theme };
}

export function getTeamStylesByIndex(index = 0) {
  const key = TEAM_ORDER[Math.abs(index) % TEAM_ORDER.length];
  return TEAM_STYLE_BY_KEY[key];
}
