const { query } = require('../config/db');

let ensured = false;

async function ensureUserSchema() {
  if (ensured) return;
  const requiredColumns = [
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS google_sub VARCHAR(64) UNIQUE',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS acessos JSONB',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lgpd_aceito_em TIMESTAMP',
    'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lgpd_versao VARCHAR(20)',
  ];
  for (const ddl of requiredColumns) {
    await query(ddl);
  }
  ensured = true;
}

module.exports = {
  ensureUserSchema,
};
