const BRAZIL_TZ = 'America/Sao_Paulo';
/** Brasil sem horário de verão desde 2019: UTC−3 o ano todo. */
const BRAZIL_OFFSET_HOURS = 3;

/**
 * Extrai relógio de parede (Brasília) de valor salvo/enviado.
 * Aceita: "2026-07-21T09:00", "2026-07-21 09:00:00", Date (ambíguo — evita).
 */
function extractBrazilWallParts(value) {
  if (value == null || value === '') return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    // Date vindo do pg depende do TZ do servidor — converte pelo instante real
    // para parede em São Paulo (correto se o Date representar o instante certo).
    return utcDateToBrazilParts(value);
  }

  const raw = String(value).trim();
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/
  );
  if (!match) return null;

  const [, year, month, day, hour, minute, second = '00', zone] = match;

  // Se veio com Z/offset, é instante absoluto → parede em Brasília.
  if (zone) {
    const utcMs = Date.parse(raw);
    if (Number.isNaN(utcMs)) return null;
    return utcDateToBrazilParts(new Date(utcMs));
  }

  // Sem zona: convenção Arena = horário de Brasília (como digitado no formulário).
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

/** Instantâneo UTC a partir de string/Date no padrão Arena (Brasília). */
function brazilDateTimeToUtcMs(value) {
  return brazilPartsToUtcMs(extractBrazilWallParts(value));
}

/**
 * Normaliza input do formulário (datetime-local) para gravar no Postgres
 * como timestamp without time zone = relógio de Brasília.
 */
function toBrazilDbTimestamp(value) {
  const parts = extractBrazilWallParts(value);
  if (!parts) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)} ${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second || 0)}`;
}

/** String estável para API/JSON (sem ambiguidade de fuso). */
function toBrazilApiTimestamp(value) {
  const parts = extractBrazilWallParts(value);
  if (!parts) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second || 0)}`;
}

function formatBrazilDisplay(value, options = {}) {
  const ms = brazilDateTimeToUtcMs(value);
  if (!Number.isFinite(ms)) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TZ,
    dateStyle: options.dateStyle || 'short',
    timeStyle: options.timeStyle || 'medium',
    ...options,
  }).format(new Date(ms));
}

function nowBrazilUtcMs() {
  return Date.now();
}

module.exports = {
  BRAZIL_TZ,
  brazilDateTimeToUtcMs,
  toBrazilDbTimestamp,
  toBrazilApiTimestamp,
  formatBrazilDisplay,
  nowBrazilUtcMs,
  extractBrazilWallParts,
};
