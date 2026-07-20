const { query } = require('../config/db');

let ensured = false;

async function ensureMediaTable() {
  if (ensured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS midias (
      id SERIAL PRIMARY KEY,
      mime_type VARCHAR(64) NOT NULL,
      tamanho_bytes INT NOT NULL,
      largura INT,
      altura INT,
      dados BYTEA NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  ensured = true;
}

async function createMedia({ mimeType, size, width, height, buffer }) {
  await ensureMediaTable();
  const rows = await query(
    `INSERT INTO midias (mime_type, tamanho_bytes, largura, altura, dados)
     VALUES (?, ?, ?, ?, ?)
     RETURNING id, mime_type, tamanho_bytes, largura, altura, criado_em`,
    [mimeType, size, width || null, height || null, buffer]
  );
  return rows[0];
}

async function getMediaById(id) {
  await ensureMediaTable();
  const rows = await query(
    `SELECT id, mime_type, tamanho_bytes, largura, altura, dados, criado_em
     FROM midias WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  ensureMediaTable,
  createMedia,
  getMediaById,
};
