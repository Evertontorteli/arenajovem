const fs = require('fs/promises');
const path = require('path');
const { put } = require('@vercel/blob');
const AppError = require('./AppError');

async function persistUpload(file, folder = 'uploads') {
  if (!file) return null;

  const originalName = String(file.originalname || 'arquivo.bin');
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;

  // Vercel Blob (obrigatório em produção serverless)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`${folder}/${filename}`, file.buffer, {
      access: 'public',
      contentType: file.mimetype || 'application/octet-stream',
    });
    return blob.url;
  }

  // Fallback local (dev com disco)
  if (file.filename && !file.buffer) {
    return `/uploads/${file.filename}`;
  }

  if (!file.buffer) {
    throw new AppError(
      'Upload indisponível: configure BLOB_READ_WRITE_TOKEN no Vercel (Storage > Blob).',
      500
    );
  }

  const uploadsDir = path.resolve(__dirname, '..', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

module.exports = { persistUpload };
