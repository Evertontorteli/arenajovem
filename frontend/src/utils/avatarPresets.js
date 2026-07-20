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

export function resolveAvatarImageUrl(foto, apiBase = import.meta.env.VITE_API_URL_BASE || 'http://localhost:3333') {
  if (!foto || isPresetAvatar(foto)) return null;
  if (foto.startsWith('http://') || foto.startsWith('https://')) return foto;
  if (foto.startsWith('/')) return `${apiBase}${foto}`;
  return foto;
}

export function resolveMediaUrl(url, apiBase = import.meta.env.VITE_API_URL_BASE || 'http://localhost:3333') {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${apiBase}${url}`;
  return url;
}
