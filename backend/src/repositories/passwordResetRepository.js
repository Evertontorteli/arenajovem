const crypto = require('crypto');
const { query } = require('../config/db');

let ensured = false;

async function ensurePasswordResetTable() {
  if (ensured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id SERIAL PRIMARY KEY,
      usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      email VARCHAR(150) NOT NULL,
      codigo_hash VARCHAR(128) NOT NULL,
      tentativas INT NOT NULL DEFAULT 0,
      expira_em TIMESTAMP NOT NULL,
      usado_em TIMESTAMP,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_email_ativo
      ON password_reset_codes (email, expira_em DESC)
      WHERE usado_em IS NULL
  `);
  ensured = true;
}

function hashCode(code) {
  const secret = process.env.JWT_SECRET || 'arena-reset-secret';
  return crypto
    .createHash('sha256')
    .update(`${secret}:${String(code).trim()}`)
    .digest('hex');
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function invalidateActiveCodes(email) {
  await ensurePasswordResetTable();
  await query(
    `UPDATE password_reset_codes
     SET usado_em = NOW()
     WHERE email = ? AND usado_em IS NULL`,
    [email]
  );
}

async function createResetCode({ usuarioId, email, ttlMinutes = 15 }) {
  await ensurePasswordResetTable();
  await invalidateActiveCodes(email);

  const codigo = generateCode();
  const codigoHash = hashCode(codigo);
  const rows = await query(
    `INSERT INTO password_reset_codes (usuario_id, email, codigo_hash, expira_em)
     VALUES (?, ?, ?, NOW() + (?::int * INTERVAL '1 minute'))
     RETURNING id, expira_em`,
    [usuarioId, email, codigoHash, Number(ttlMinutes)]
  );

  return {
    id: rows[0].id,
    codigo,
    expiraEm: rows[0].expira_em,
  };
}

async function findActiveResetByEmail(email) {
  await ensurePasswordResetTable();
  const rows = await query(
    `SELECT *
     FROM password_reset_codes
     WHERE email = ?
       AND usado_em IS NULL
       AND expira_em > NOW()
     ORDER BY criado_em DESC
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function incrementAttempts(id) {
  await query(
    `UPDATE password_reset_codes
     SET tentativas = tentativas + 1
     WHERE id = ?`,
    [id]
  );
}

async function markUsed(id) {
  await query(
    `UPDATE password_reset_codes
     SET usado_em = NOW()
     WHERE id = ?`,
    [id]
  );
}

function matchesCode(row, code) {
  if (!row) return false;
  return row.codigo_hash === hashCode(code);
}

module.exports = {
  ensurePasswordResetTable,
  createResetCode,
  findActiveResetByEmail,
  invalidateActiveCodes,
  incrementAttempts,
  markUsed,
  matchesCode,
  generateCode,
  hashCode,
};
