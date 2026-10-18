const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

// WebP pesa ~25-35 % menos que JPEG con la misma calidad visual.
const SIZES = {
  thumbnail: { width: 320, height: 320, quality: 72, fit: 'cover' },
  medium: { width: 800, quality: 78, fit: 'inside' },
  original: { width: 1440, quality: 82, fit: 'inside' },
};

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Procesa una imagen subida y genera thumbnail/medium/original comprimidos en WebP,
 * guardados en uploads/<namespace>/<entityId>/. `rotate()` aplica la orientación de
 * la cámara y descarta los metadatos EXIF (incluida la ubicación).
 * Devuelve las URLs públicas relativas y las medidas de la versión grande
 * (`width`/`height`), que el cliente usa para acomodar la foto en su recuadro.
 */
async function processImage(buffer, namespace, entityId) {
  const dir = path.join(UPLOADS_ROOT, namespace, String(entityId));
  await ensureDir(dir);

  const baseName = crypto.randomUUID();
  const urls = {};

  for (const [variant, opts] of Object.entries(SIZES)) {
    const fileName = `${baseName}-${variant}.webp`;
    const filePath = path.join(dir, fileName);

    let pipeline = sharp(buffer).rotate();
    pipeline = opts.fit === 'cover'
      ? pipeline.resize(opts.width, opts.height, { fit: 'cover' })
      : pipeline.resize({ width: opts.width, height: opts.width, fit: 'inside', withoutEnlargement: true });

    const info = await pipeline.webp({ quality: opts.quality }).toFile(filePath);
    urls[variant] = `/uploads/${namespace}/${entityId}/${fileName}`;
    if (variant === 'original') {
      urls.width = info.width;
      urls.height = info.height;
    }
  }

  return urls;
}

/** Medidas de una imagen ya guardada (para fotos subidas antes de registrarlas). */
async function readSize(publicUrl) {
  const filePath = path.join(UPLOADS_ROOT, publicUrl.replace(/^\/uploads\//, ''));
  const meta = await sharp(filePath).metadata();
  return { width: meta.width, height: meta.height };
}

async function deleteEntityImages(namespace, entityId) {
  const dir = path.join(UPLOADS_ROOT, namespace, String(entityId));
  await fs.rm(dir, { recursive: true, force: true });
}

module.exports = { processImage, deleteEntityImages, readSize };
