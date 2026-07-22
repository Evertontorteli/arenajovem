export const AVATAR_PRESET_PREFIX = 'preset:';

export const AVATAR_PRESETS = [
  { id: 'cat', label: 'Gato' },
  { id: 'dog', label: 'Cachorro' },
  { id: 'bear', label: 'Urso' },
  { id: 'fox', label: 'Raposa' },
  { id: 'rabbit', label: 'Coelho' },
  { id: 'panda', label: 'Panda' },
  { id: 'lion', label: 'Leão' },
  { id: 'owl', label: 'Coruja' },
  { id: 'tiger', label: 'Tigre' },
  { id: 'wolf', label: 'Lobo' },
  { id: 'monkey', label: 'Macaco' },
  { id: 'penguin', label: 'Pinguim' },
  { id: 'koala', label: 'Coala' },
  { id: 'frog', label: 'Sapo' },
  { id: 'chick', label: 'Pintinho' },
  { id: 'pig', label: 'Porquinho' },
  { id: 'unicorn', label: 'Unicórnio' },
  { id: 'dolphin', label: 'Golfinho' },
];

export function isPresetAvatar(foto) {
  return typeof foto === 'string' && foto.startsWith(AVATAR_PRESET_PREFIX);
}

export function getPresetAvatarId(foto) {
  if (!isPresetAvatar(foto)) return null;
  return foto.slice(AVATAR_PRESET_PREFIX.length);
}

export function buildPresetAvatarValue(id) {
  return `${AVATAR_PRESET_PREFIX}${id}`;
}

function isUnusableApiBase(value) {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/Volumes/')) return true;
  if (trimmed.startsWith('file:')) return true;
  if (!import.meta.env.DEV && /localhost|127\.0\.0\.1/.test(trimmed)) return true;
  return false;
}

/**
 * Origem do backend para montar URLs de mídia.
 * - Dev: http://localhost:3333
 * - Prod (mesmo domínio): '' (URL relativa)
 * - Se VITE_API_URL_BASE for "/api", trata como origem vazia (evita /api/api/media/...).
 */
export function resolveApiBase(apiBase) {
  const raw =
    apiBase !== undefined && apiBase !== null && !isUnusableApiBase(apiBase)
      ? String(apiBase)
      : !isUnusableApiBase(import.meta.env.VITE_API_URL_BASE)
        ? String(import.meta.env.VITE_API_URL_BASE)
        : import.meta.env.DEV
          ? 'http://localhost:3333'
          : '';

  let base = raw.trim().replace(/\/$/, '');
  if (base === '/api') return '';
  if (base.endsWith('/api')) return base.slice(0, -4);
  return base;
}

export function resolveAvatarImageUrl(foto, apiBase) {
  if (!foto || isPresetAvatar(foto)) return null;
  if (foto.startsWith('http://') || foto.startsWith('https://')) return foto;
  if (foto.startsWith('/')) return `${resolveApiBase(apiBase)}${foto}`;
  return foto;
}

export function resolveMediaUrl(url, apiBase) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${resolveApiBase(apiBase)}${url}`;
  return url;
}
