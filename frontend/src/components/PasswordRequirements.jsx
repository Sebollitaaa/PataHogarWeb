import { CheckIcon, XIcon } from './icons/Icons';
import { PASSWORD_RULES } from '../utils/passwordRules';
import './password-field.css';

/** Checklist en vivo: cada requisito se marca en verde al cumplirse. */
export default function PasswordRequirements({ value }) {
  return (
    <ul className="password-rules" aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.id} className={ok ? 'password-rules__item password-rules__item--ok' : 'password-rules__item'}>
            <span className="password-rules__icon">{ok ? <CheckIcon size={12} /> : <XIcon size={12} />}</span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
