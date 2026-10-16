import './age-input.css';

/**
 * Selector de edad de la mascota: o se marca la fecha de nacimiento (y el sistema
 * calcula la edad solo), o se carga la edad a mano en años/meses/días.
 */
export default function AgeInput({ ageMode, birthDate, ageYears, ageMonths, ageDays, onChange }) {
  return (
    <div>
      <div className="segmented" style={{ marginBottom: 10 }}>
        <button
          type="button"
          className={ageMode === 'birth_date' ? 'segmented__item segmented__item--active' : 'segmented__item'}
          onClick={() => onChange({ ageMode: 'birth_date' })}
        >
          Fecha de nacimiento
        </button>
        <button
          type="button"
          className={ageMode === 'manual' ? 'segmented__item segmented__item--active' : 'segmented__item'}
          onClick={() => onChange({ ageMode: 'manual' })}
        >
          Cargar edad a mano
        </button>
      </div>

      {ageMode === 'birth_date' ? (
        <input
          type="date"
          className="input"
          max={new Date().toISOString().slice(0, 10)}
          value={birthDate || ''}
          onChange={(e) => onChange({ birthDate: e.target.value })}
        />
      ) : (
        <>
          <div className="age-input__manual">
            <label className="age-input__part">
              <span>Años</span>
              <input
                type="number" min="0" max="40" inputMode="numeric" className="input" placeholder="—"
                value={ageYears} onChange={(e) => onChange({ ageYears: e.target.value })}
              />
            </label>
            <label className="age-input__part">
              <span>Meses</span>
              <input
                type="number" min="0" max="11" inputMode="numeric" className="input" placeholder="—"
                value={ageMonths} onChange={(e) => onChange({ ageMonths: e.target.value })}
              />
            </label>
            <label className="age-input__part">
              <span>Días</span>
              <input
                type="number" min="0" max="364" inputMode="numeric" className="input" placeholder="—"
                value={ageDays} onChange={(e) => onChange({ ageDays: e.target.value })}
              />
            </label>
          </div>
          <p className="field-hint" style={{ marginTop: 6 }}>
            Completá solo lo que sepas (por ejemplo, solo "5" en meses). La edad se va actualizando sola con el paso del tiempo.
          </p>
        </>
      )}
    </div>
  );
}

/** Devuelve un mensaje de error si la edad cargada a mano está vacía (o todo en 0). */
export function validateAge({ ageMode, birthDate, ageYears, ageMonths, ageDays }) {
  if (ageMode === 'birth_date') return birthDate ? '' : 'Indicá la fecha de nacimiento.';
  const total = [ageYears, ageMonths, ageDays].reduce((sum, v) => sum + (Number(v) || 0), 0);
  return total > 0 ? '' : 'Indicá la edad: completá al menos años, meses o días.';
}
