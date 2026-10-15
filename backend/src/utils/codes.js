const crypto = require('crypto');

/** Código numérico de `length` dígitos, generado con un RNG criptográfico (conserva ceros a la izquierda). */
function generateNumericCode(length = 6) {
  return String(crypto.randomInt(0, 10 ** length)).padStart(length, '0');
}

module.exports = { generateNumericCode };
