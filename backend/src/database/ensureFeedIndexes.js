const { query } = require('../config/db');

let ensured = false;

async function ensureFeedIndexes() {
  if (ensured) return;
  const statements = [
    `CREATE INDEX IF NOT EXISTS idx_publicacoes_feed
       ON publicacoes (criado_em DESC, id DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_publicacoes_autor
       ON publicacoes (autor_id)`,
    `CREATE INDEX IF NOT EXISTS idx_curtidas_publicacao
       ON curtidas (publicacao_id)`,
    `CREATE INDEX IF NOT EXISTS idx_curtidas_usuario_publicacao
       ON curtidas (usuario_id, publicacao_id)`,
    `CREATE INDEX IF NOT EXISTS idx_comentarios_publicacao_raiz
       ON comentarios (publicacao_id, criado_em DESC)
       WHERE parent_id IS NULL`,
    `CREATE INDEX IF NOT EXISTS idx_comentarios_parent
       ON comentarios (parent_id, criado_em ASC)`,
    `CREATE TABLE IF NOT EXISTS curtidas_comentarios (
       id SERIAL PRIMARY KEY,
       comentario_id INT NOT NULL,
       usuario_id INT NOT NULL,
       criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       CONSTRAINT unique_comment_like UNIQUE (comentario_id, usuario_id),
       FOREIGN KEY (comentario_id) REFERENCES comentarios(id) ON DELETE CASCADE,
       FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
     )`,
    `CREATE INDEX IF NOT EXISTS idx_curtidas_comentarios_comentario
       ON curtidas_comentarios (comentario_id)`,
    `CREATE INDEX IF NOT EXISTS idx_curtidas_comentarios_usuario
       ON curtidas_comentarios (usuario_id, comentario_id)`,
  ];
  for (const ddl of statements) {
    await query(ddl);
  }
  ensured = true;
}

module.exports = { ensureFeedIndexes };
