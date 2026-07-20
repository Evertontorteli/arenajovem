const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
]);
const allowedExtensions = new Set([
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

const fileFilter = (_req, file, cb) => {
  const extension = path.extname(String(file.originalname || '')).toLowerCase();
  const isValidMimeType = String(file.mimetype || '').startsWith('image/');
  const isKnownMimeType =
    allowedMimeTypes.has(file.mimetype) || isValidMimeType;
  const isKnownExtension = allowedExtensions.has(extension);

  if (!isKnownMimeType || !isKnownExtension) {
    return cb(
      new AppError(
        'Formato de imagem não suportado. Use JPG, PNG, WEBP, GIF, HEIC ou AVIF.',
        400
      )
    );
  }
  return cb(null, true);
};

// memoryStorage: funciona no Vercel (serverless). Disco local nao e persistente.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
