/**
 * Teléfonos de Argentina (misma lógica que backend/src/utils/phone.js).
 * En los formularios el +54 está fijo y se escribe solo el código de área y el número.
 */

/** Los 10 dígitos del número nacional, o null si no alcanzan / sobran. */
export function nationalDigits(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('54') && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith('9') && digits.length === 11) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 12) {
    const at = [2, 3, 4].find((i) => digits.slice(i, i + 2) === '15');
    if (at !== undefined) digits = digits.slice(0, at) + digits.slice(at + 2);
  }
  return digits.length === 10 ? digits : null;
}

/** Parte nacional para mostrar en el campo: "+54 9 291 555-0103" → "291 555-0103". */
export function toNationalDisplay(value) {
  const d = nationalDigits(value);
  if (!d) return String(value || '').replace(/^\s*\+?54\s*9?\s*/, '');
  return d.startsWith('11') ? `11 ${d.slice(2, 6)}-${d.slice(6)}` : `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isValidPhone(value) {
  return nationalDigits(value) !== null;
}

export const PHONE_HINT = 'Código de área sin 0 y número sin 15. Ej.: 291 555-0103';
