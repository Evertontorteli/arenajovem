-- Migração aplicada via script; schema de referência atualizado em schema.sql
ALTER TABLE comentarios
  ADD COLUMN IF NOT EXISTS parent_id INT NULL REFERENCES comentarios(id) ON DELETE CASCADE;

ALTER TABLE comentarios
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_comentarios_publicacao_parent
  ON comentarios (publicacao_id, parent_id, criado_em DESC);
