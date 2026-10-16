const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ApiError = require('../utils/ApiError');

// Carpeta PRIVADA: a diferencia de /uploads, no se sirve de forma estática.
// Las fotos del chat solo se entregan a los participantes (ver conversationController.getAttachment).
const CHAT_ROOT = path.join(__dirname, '..', '..', 'storage', 'chat');

const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif']);
const MAX_PHOTOS_PER_MESSAGE = 5;

const VARIANTS = {
  thumb: { width: 360, quality: 72 },
  medium: { width: 1280, quality: 80 },
};

function conversationDir(conversationId) {
  return path.join(CHAT_ROOT, String(conversationId));
}

/**
 * Valida que cada archivo sea realmente una imagen (por su contenido, no por la
 * extensión que declaró el cliente) y genera miniatura + versión mediana.
 * `rotate()` aplica la orientación y descarta los metadatos EXIF (ubicación incluida).
 * Devuelve los nombres de archivo guardados.
 */
async function saveImages(conversationId, buffers) {
  if (buffers.length > MAX_PHOTOS_PER_MESSAGE) {
    throw new ApiError(422, `Podés enviar hasta ${MAX_PHOTOS_PER_MESSAGE} fotos por mensaje.`);
  }

  const dir = conversationDir(conversationId);
  await fs.mkdir(dir, { recursive: true });

  const saved = [];
  try {
    for (const buffer of buffers) {
      let meta;
      try {
        meta = await sharp(buffer).metadata();
      } catch {
        throw new ApiError(422, 'Uno de los archivos no es una imagen válida.');
      }
      if (!ALLOWED_FORMATS.has(meta.format)) {
        throw new ApiError(422, 'Solo se pueden enviar fotos (JPG, PNG, WebP o GIF).');
      }

      const base = crypto.randomUUID();
      const item = { thumbFile: `${base}-thumb.jpg`, mediumFile: `${base}-medium.jpg`, width: null, height: null };

      for (const [variant, opts] of Object.entries(VARIANTS)) {
        const file = variant === 'thumb' ? item.thumbFile : item.mediumFile;
        const info = await sharp(buffer)
          .rotate()
          .resize({ width: opts.width, withoutEnlargement: true })
          .jpeg({ quality: opts.quality })
          .toFile(path.join(dir, file));
        if (variant === 'medium') {
          item.width = info.width;
          item.height = info.height;
        }
      }
      saved.push(item);
    }
  } catch (err) {
    await deleteFiles(conversationId, saved.flatMap((s) => [s.thumbFile, s.mediumFile]));
    throw err;
  }

  return saved;
}

function filePath(conversationId, fileName) {
  // basename evita que un nombre manipulado salga de la carpeta de la conversación.
  return path.join(conversationDir(conversationId), path.basename(fileName));
}

async function deleteFiles(conversationId, fileNames) {
  await Promise.all(
    fileNames.map((name) => fs.rm(filePath(conversationId, name), { force: true }).catch(() => {}))
  );
}

async function deleteConversation(conversationId) {
  await fs.rm(conversationDir(conversationId), { recursive: true, force: true }).catch(() => {});
}

module.exports = { saveImages, filePath, deleteFiles, deleteConversation, MAX_PHOTOS_PER_MESSAGE };
