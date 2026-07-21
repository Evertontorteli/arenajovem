const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const imageExt = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.jfif',
  '.heic',
  '.heif',
  '.avif',
]);
const audioExt = new Set(['.mp3', '.mpeg', '.wav', '.ogg', '.m4a', '.aac', '.webm']);
const videoExt = new Set(['.mp4', '.webm', '.mov', '.m4v', '.avi']);

function kindFromFile(file) {
  const mime = String(file?.mimetype || '').toLowerCase();
  const extension = path.extname(String(file?.originalname || '')).toLowerCase();
  if (mime.startsWith('image/') || imageExt.has(extension)) return 'IMAGEM';
  if (mime.startsWith('audio/') || audioExt.has(extension)) return 'AUDIO';
  if (mime.startsWith('video/') || videoExt.has(extension)) return 'VIDEO';
  return null;
}

const fileFilter = (_req, file, cb) => {
  const kind = kindFromFile(file);
  if (!kind) {
    return cb(
      new AppError(
        'Formato não suportado. Use imagem (JPG/PNG/WEBP), áudio (MP3/WAV/M4A/OGG) ou vídeo (MP4/WEBM/MOV).',
        400
      )
    );
  }
  return cb(null, true);
};

const uploadMedia = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});

module.exports = {
  uploadMedia,
  kindFromFile,
};
