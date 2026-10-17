import { useState } from 'react';
import { toNationalDisplay } from '../utils/phone';
import './phone-input.css';

/**
 * Teléfono de Argentina: el "+54" queda fijo a la izquierda y se escribe solo
 * el código de área y el número. `value` puede venir guardado completo
 * ("+54 9 291 555-0103"); se muestra solo la parte nacional.
 */
export default function PhoneInput({ id, value, onChange, required = false, placeholder = '291 555-0103' }) {
  const [focused, setFocused] = useState(false);
  // Mientras se escribe se muestra tal cual; al salir del campo se acomoda el formato.
  const shown = focused ? String(value || '').replace(/^\s*\+54\s*9?\s*/, '') : toNationalDisplay(value);

  return (
    <div className="phone-input">
      <span className="phone-input__prefix" aria-hidden="true">
        <svg className="phone-input__flag" width="20" height="14" viewBox="0 0 20 14">
          <rect width="20" height="14" rx="2" fill="#74ACDF" />
          <rect y="4.67" width="20" height="4.67" fill="#fff" />
          <circle cx="10" cy="7" r="1.5" fill="#F6B40E" />
        </svg>
        +54
      </span>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className="input phone-input__field"
        required={required}
        placeholder={placeholder}
        aria-label="Código de área y número"
        value={shown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/[^\d\s-]/g, ''))}
      />
    </div>
  );
}
