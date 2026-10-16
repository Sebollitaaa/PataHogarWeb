// Mismas reglas que valida el backend (backend/src/validators/passwordPolicy.js).
export const PASSWORD_RULES = [
  { id: 'length', label: 'Al menos 8 caracteres', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Una letra mayúscula', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Una letra minúscula', test: (v) => /[a-z]/.test(v) },
  { id: 'digit', label: 'Un número', test: (v) => /\d/.test(v) },
  { id: 'symbol', label: 'Un símbolo (por ejemplo ! @ # $ %)', test: (v) => /[^A-Za-z0-9\s]/.test(v) },
];

export function isPasswordValid(value) {
  return value.length <= 72 && PASSWORD_RULES.every((rule) => rule.test(value));
}
