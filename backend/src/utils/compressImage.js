const sharp = require('sharp');
const AppError = require('./AppError');

/** Limite estilo feed Instagram: lado maior ~1080px, WebP leve. */
const MAX_EDGE = 1080;
const WEBP_QUALITY = 80;
const MAX_OUTPUT_BYTES = 900 * 1024;

async function compressImage(file) {
  if (!file?.buffer?.length) {
    throw new AppError('Arquivo de imagem inválido.', 400);
  }

  try {
    let pipeline = sharp(file.buffer, {
      failOn: 'none',
      animated: false,
    })
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      });

    let output = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer({
      resolveWithObject: true,
    });

    // Se ainda ficar grande, reduz qualidade em passos.
    if (output.info.size > MAX_OUTPUT_BYTES) {
      for (const quality of [70, 60, 50]) {
        output = await sharp(file.buffer, { failOn: 'none', animated: false })
          .rotate()
          .resize({
            width: MAX_EDGE,
            height: MAX_EDGE,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality, effort: 5 })
          .toBuffer({ resolveWithObject: true });
        if (output.info.size <= MAX_OUTPUT_BYTES) break;
      }
    }

    return {
      buffer: output.data,
      mimeType: 'image/webp',
      size: output.info.size,
      width: output.info.width,
      height: output.info.height,
    };
  } catch (_error) {
    throw new AppError(
      'Não foi possível processar a imagem. Tente JPG, PNG ou WEBP.',
      400
    );
  }
}

module.exports = { compressImage, MAX_EDGE, WEBP_QUALITY };
