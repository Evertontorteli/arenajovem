const mediaRepository = require('../repositories/mediaRepository');
const AppError = require('../utils/AppError');

async function getMedia(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Mídia inválida.', 400);
  }

  const media = await mediaRepository.getMediaById(id);
  if (!media) {
    throw new AppError('Mídia não encontrada.', 404);
  }

  const body = Buffer.isBuffer(media.dados)
    ? media.dados
    : Buffer.from(media.dados);

  res.setHeader('Content-Type', media.mime_type || 'image/webp');
  res.setHeader('Content-Length', String(body.length));
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  return res.status(200).send(body);
}

module.exports = { getMedia };
