import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons/Icons';
import './password-field.css';

/** Campo de contraseña con botón para mostrar/ocultar lo que se escribe. */
export default function PasswordInput({ id, value, onChange, autoComplete = 'current-password', placeholder, required = true, autoFocus = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
        title={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
      >
        {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  );
}
