/**
 * Exige nome e sobrenome (pelo menos 2 palavras com 2+ letras cada).
 */
export function normalizeFullName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function isValidFullName(value) {
  const nome = normalizeFullName(value);
  if (!nome) return false;
  const parts = nome.split(' ').filter((part) => part.length >= 2);
  return parts.length >= 2;
}
