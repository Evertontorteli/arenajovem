const crypto = require('crypto');

const CURSOR_SECRET =
  process.env.CURSOR_SECRET ||
  process.env.JWT_SECRET ||
  'arena-jovem-cursor-secret';
const CURSOR_TTL_SECONDS = Math.max(
  60,
  Number(process.env.CURSOR_TTL_SECONDS || 3600)
);

function sign(payloadBase64) {
  return crypto
    .createHmac('sha256', CURSOR_SECRET)
    .update(payloadBase64)
    .digest('base64url');
}

function safeCompare(a, b) {
  const aBuffer = Buffer.from(String(a || ''), 'utf8');
  const bBuffer = Buffer.from(String(b || ''), 'utf8');
  if (aBuffer.length !== bBuffer.length) return false;
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function encodeCursorToken(post) {
  if (!post) return null;

  const payload = {
    id: Number(post.id),
    criadoEm: new Date(post.criado_em).toISOString(),
    exp: Math.floor(Date.now() / 1000) + CURSOR_TTL_SECONDS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

function decodeCursorToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = sign(payloadBase64);
  if (!safeCompare(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8')
    );
    if (!payload.id || !payload.criadoEm || !payload.exp) return null;
    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (Number(payload.exp) < nowInSeconds) return null;

    return {
      id: Number(payload.id),
      criadoEm: payload.criadoEm,
    };
  } catch (_error) {
    return null;
  }
}

module.exports = {
  encodeCursorToken,
  decodeCursorToken,
};
