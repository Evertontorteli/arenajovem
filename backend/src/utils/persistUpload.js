const { compressImage } = require('./compressImage');
const mediaRepository = require('../repositories/mediaRepository');
const AppError = require('./AppError');

/**
 * Comprime a imagem (estilo Instagram) e grava no Postgres (BYTEA).
 * Retorna URL relativa servida por GET /api/media/:id.
 */
async function persistUpload(file) {
  if (!file) return null;

  const compressed = await compressImage(file);
  const media = await mediaRepository.createMedia({
    mimeType: compressed.mimeType,
    size: compressed.size,
    width: compressed.width,
    height: compressed.height,
    buffer: compressed.buffer,
  });

  if (!media?.id) {
    throw new AppError('Falha ao salvar a imagem no banco.', 500);
  }

  return `/api/media/${media.id}`;
}

module.exports = { persistUpload };
