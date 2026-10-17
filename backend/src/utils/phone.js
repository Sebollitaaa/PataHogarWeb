/**
 * Teléfonos de Argentina. La persona escribe el código de área y el número
 * (el +54 está fijo en el formulario) y se guarda siempre con el mismo formato,
 * listo para los enlaces de WhatsApp: "+54 9 291 555-0103".
 * La misma lógica está en frontend/src/utils/phone.js.
 */

const MESSAGE = 'Ingresá el código de área sin 0 y el número sin 15 (10 dígitos en total). Ej.: 291 555-0103.';

/** Devuelve los 10 dígitos del número nacional, o null si no es un número válido. */
function nationalDigits(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return null;

  // Prefijos que la gente suele escribir por costumbre: 54 (país), 9 (celular), 0 (larga distancia).
  if (digits.startsWith('54') && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith('9') && digits.length === 11) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = digits.slice(1);

  // "15" después del código de área (código de 2, 3 o 4 dígitos): 291 15 555-0103.
  if (digits.length === 12) {
    const at = [2, 3, 4].find((i) => digits.slice(i, i + 2) === '15');
    if (at !== undefined) digits = digits.slice(0, at) + digits.slice(at + 2);
  }

  return digits.length === 10 ? digits : null;
}

/** Formato de guardado: "+54 9 11 5555-0103" (Buenos Aires) o "+54 9 291 555-0103". */
function normalizePhone(value) {
  const d = nationalDigits(value);
  if (!d) return null;
  return d.startsWith('11')
    ? `+54 9 11 ${d.slice(2, 6)}-${d.slice(6)}`
    : `+54 9 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Regla de express-validator: valida y deja el número en el formato de guardado. */
function phoneRule(chain) {
  return chain
    .custom((value) => normalizePhone(value) !== null)
    .withMessage(MESSAGE)
    .customSanitizer((value) => normalizePhone(value));
}

module.exports = { normalizePhone, nationalDigits, phoneRule, PHONE_MESSAGE: MESSAGE };
