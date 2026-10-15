// Política mínima de contraseñas. El frontend replica estas mismas reglas
// (frontend/src/utils/passwordRules.js) para mostrar el checklist en vivo.
const MIN_LENGTH = 8;
const MAX_LENGTH = 72; // bcrypt solo procesa los primeros 72 bytes

const MESSAGE = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.';

function isStrongPassword(value) {
  if (typeof value !== 'string') return false;
  return (
    value.length >= MIN_LENGTH
    && value.length <= MAX_LENGTH
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9\s]/.test(value)
  );
}

/** Cadena de validación de express-validator para un campo de contraseña nueva. */
function passwordRule(chain) {
  return chain
    .custom((value) => isStrongPassword(value))
    .withMessage(MESSAGE);
}

module.exports = { isStrongPassword, passwordRule, MESSAGE, MIN_LENGTH, MAX_LENGTH };
