const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { generateNumericCode } = require('../utils/codes');
const emailCodeRepository = require('../models/emailCodeRepository');
const emailService = require('./emailService');

const PURPOSES = { VERIFY_EMAIL: 'verify_email', RESET_PASSWORD: 'reset_password' };

// El código es de pocos dígitos: se guarda con HMAC (clave del servidor) para que
// una filtración de la base no permita reconstruir códigos vigentes por fuerza bruta offline.
function hashCode(userId, purpose, code) {
  return crypto
    .createHmac('sha256', env.jwt.refreshSecret)
    .update(`${userId}:${purpose}:${code}`)
    .digest('hex');
}

/** Cantidad de segundos que faltan para poder pedir otro código (0 si ya se puede). */
async function cooldownRemaining(userId, purpose) {
  const elapsed = await emailCodeRepository.secondsSinceLatest(userId, purpose);
  if (elapsed === null) return 0;
  return Math.max(0, env.email.resendCooldownSeconds - elapsed);
}

/**
 * Genera un código nuevo (invalidando los anteriores) y lo envía por correo.
 * Devuelve true si el correo salió bien; false si el envío falló (el código queda
 * generado y el usuario puede pedir un reenvío).
 */
async function issueAndSend(user, purpose) {
  await emailCodeRepository.invalidateActive(user.id, purpose);

  const code = generateNumericCode(6);
  await emailCodeRepository.create({
    user_id: user.id,
    purpose,
    code_hash: hashCode(user.id, purpose, code),
    expires_at: new Date(Date.now() + env.email.codeExpiresMinutes * 60 * 1000),
  });

  try {
    if (purpose === PURPOSES.VERIFY_EMAIL) {
      await emailService.sendVerificationCodeEmail(user.email, user.first_name, code);
    } else {
      await emailService.sendPasswordResetEmail(user.email, user.first_name, code);
    }
    return true;
  } catch (err) {
    logger.error('No se pudo enviar el correo con el código:', err.message);
    return false;
  }
}

/**
 * Valida el código ingresado. Si es correcto lo consume. Ante un error siempre
 * responde el mismo mensaje genérico, para no revelar si el correo existe.
 */
async function consume(user, purpose, code) {
  const invalid = new ApiError(400, 'El código es incorrecto o ya venció. Pedí uno nuevo.');
  if (!user) throw invalid;

  const record = await emailCodeRepository.findActive(user.id, purpose);
  if (!record) throw invalid;

  if (record.attempts >= env.email.maxAttempts) {
    throw new ApiError(429, 'Superaste el límite de intentos. Pedí un código nuevo.');
  }

  if (record.code_hash !== hashCode(user.id, purpose, String(code))) {
    await emailCodeRepository.incrementAttempts(record.id);
    throw invalid;
  }

  await emailCodeRepository.markUsed(record.id);
}

module.exports = { PURPOSES, issueAndSend, consume, cooldownRemaining };
