import { CheckIcon } from './icons/Icons';
import './verified-badge.css';

export default function VerifiedBadge({ size = 15 }) {
  return (
    <span className="verified-badge" style={{ width: size, height: size }} title="Organización verificada">
      <CheckIcon size={Math.round(size * 0.62)} />
    </span>
  );
}
