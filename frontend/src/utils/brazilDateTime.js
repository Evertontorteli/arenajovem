export const BRAZIL_TZ = 'America/Sao_Paulo';
const BRAZIL_OFFSET_HOURS = 3;

function extractBrazilWallParts(value) {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return utcDateToBrazilParts(value);
  }

  const raw = String(value).trim();
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second = '00', zone] = match;

  if (zone) {
    const utcMs = Date.parse(raw);
    if (Number.isNaN(utcMs)) return null;
    return utcDateToBrazilParts(new Date(utcMs));
  }

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
}

function utcDateToBrazilParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: BRAZIL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function brazilPartsToUtcMs(parts) {
  if (!parts) return NaN;
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour + BRAZIL_OFFSET_HOURS,
    parts.minute,
    parts.second || 0
  );
}

export function brazilDateTimeToUtcMs(value) {
  return brazilPartsToUtcMs(extractBrazilWallParts(value));
}

/** Valor para <input type="datetime-local"> a partir do horário de Brasília. */
export function toDatetimeLocalBrazil(value) {
  const parts = extractBrazilWallParts(value);
  if (!parts) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function formatBrazilDisplay(value, options = {}) {
  const ms = brazilDateTimeToUtcMs(value);
  if (!Number.isFinite(ms)) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TZ,
    dateStyle: options.dateStyle || 'short',
    timeStyle: options.timeStyle || 'medium',
    ...options,
  }).format(new Date(ms));
}
