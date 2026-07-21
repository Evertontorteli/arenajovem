const { compressImage } = require('./compressImage');
const mediaRepository = require('../repositories/mediaRepository');
const AppError = require('./AppError');
const { kindFromFile } = require('../middlewares/uploadMediaMiddleware');

/**
 * Grava mídia no Postgres (BYTEA).
 * Imagens passam por compressão; áudio/vídeo são salvos como enviados.
 * Retorna { url, kind, mimeType }.
 */
async function persistMedia(file, options = {}) {
  if (!file) return null;

  const kind = kindFromFile(file) || 'IMAGEM';
  const shouldCompress = options.compress !== false && kind === 'IMAGEM';

  let mimeType = file.mimetype;
  let size = file.size;
  let width = null;
  let height = null;
  let buffer = file.buffer;

  if (shouldCompress) {
    const compressed = await compressImage(file);
    mimeType = compressed.mimeType;
    size = compressed.size;
    width = compressed.width;
    height = compressed.height;
    buffer = compressed.buffer;
  } else if (!Buffer.isBuffer(buffer)) {
    throw new AppError('Arquivo de mídia inválido.', 400);
  }

  const media = await mediaRepository.createMedia({
    mimeType,
    size,
    width,
    height,
    buffer,
  });

  if (!media?.id) {
    throw new AppError('Falha ao salvar a mídia no banco.', 500);
  }

  return {
    url: `/api/media/${media.id}`,
    kind,
    mimeType,
  };
}

/**
 * Compatível com o uso antigo: retorna só a URL relativa.
 */
async function persistUpload(file, options = {}) {
  const saved = await persistMedia(file, options);
  return saved?.url || null;
}

module.exports = {
  persistMedia,
  persistUpload,
};
