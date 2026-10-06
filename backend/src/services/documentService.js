const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function safeExtension(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : '';
}

/**
 * Guarda un documento de una solicitud de verificación en disco (sin procesarlo,
 * a diferencia de las fotos de mascotas). Devuelve la ruta absoluta, porque la
 * desktop app que revisa estas solicitudes corre en la misma PC y abre los
 * archivos directo desde esa ruta.
 */
async function saveVerificationDocument(buffer, requestId, documentType, originalName) {
  const dir = path.join(UPLOADS_ROOT, 'verification-documents', String(requestId));
  await ensureDir(dir);

  const fileName = `${documentType}-${crypto.randomUUID()}${safeExtension(originalName)}`;
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, buffer);

  return filePath;
}

module.exports = { saveVerificationDocument };
