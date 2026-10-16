const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calcula años/meses/días transcurridos entre una fecha de nacimiento y "ahora",
 * como una calculadora de edad de calendario normal (no solo dividir milisegundos).
 */
function computeAgeFromBirthDate(birthDate, now = new Date()) {
  const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: Math.max(years, 0),
    months: Math.max(months, 0),
    days: Math.max(days, 0),
  };
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Edad cargada a mano que avanza con el tiempo. A partir de lo que escribió el
 * dueño y del día en que lo cargó, estima la fecha de nacimiento y calcula la
 * edad a la fecha `until` (hoy, o el día de la adopción si ya fue adoptada).
 * Respeta el formato cargado: si fue solo en días, sigue en días hasta los 2 meses;
 * si se cargó en años sin días, no se muestran los días.
 */
function computeManualAge({ years = 0, months = 0, days = 0 }, referenceDate, until = new Date()) {
  const reference = startOfDay(referenceDate || until);
  const end = startOfDay(until);
  const elapsedDays = Math.max(0, Math.round((end - reference) / DAY_MS));

  const birth = new Date(reference);
  birth.setFullYear(birth.getFullYear() - years);
  birth.setMonth(birth.getMonth() - months);
  birth.setDate(birth.getDate() - days);

  const age = computeAgeFromBirthDate(birth, end);

  // Cargada solo en días: se sigue contando en días ("45 días" → "52 días")
  // hasta que cumple 2 meses; ahí pasa a "2 meses y …".
  if (years === 0 && months === 0 && age.years === 0 && age.months < 2) {
    return { years: 0, months: 0, days: days + elapsedDays };
  }
  // Si se cargó en años sin días, mostrar días sería una precisión inventada.
  if (years > 0 && days === 0 && age.years > 0) age.days = 0;
  return age;
}

module.exports = { computeAgeFromBirthDate, computeManualAge };
