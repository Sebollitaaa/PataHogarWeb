import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import Field from '../components/ui/Field';
import PasswordInput from '../components/PasswordInput';
import PasswordRequirements from '../components/PasswordRequirements';
import { isPasswordValid } from '../utils/passwordRules';
import logo from '../assets/logo-header.png';
import './auth.css';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!isPasswordValid(newPassword)) {
      setError('La contraseña no cumple con todos los requisitos de seguridad.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ email, code, newPassword });
      navigate('/ingresar', { state: { passwordReset: true } });
    } catch (err) {
      setError(err.details?.length ? err.details.map((d) => d.message).join(' ') : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-card__brand"><img src={logo} alt="" className="auth-card__logo" /> PataHogar</div>
        <h1>Elegí una contraseña nueva</h1>
        <p className="auth-card__subtitle">Ingresá el código de 6 dígitos que te enviamos por correo.</p>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Email" htmlFor="email">
            <input id="email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Código" htmlFor="code">
            <input
              id="code" className="input code-input" required autoFocus
              inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </Field>
          <Field label="Nueva contraseña" htmlFor="newPassword">
            <PasswordInput id="newPassword" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <PasswordRequirements value={newPassword} />
          <Field
            label="Confirmar contraseña" htmlFor="confirm"
            error={confirm && newPassword !== confirm ? 'Las contraseñas no coinciden.' : undefined}
          >
            <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>

          <button className="btn btn-primary btn-block" disabled={loading || code.length !== 6}>
            {loading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>

        <p className="auth-card__footer">
          ¿No te llegó el código? <Link to="/olvide-password">Pedir otro</Link>
        </p>
      </div>
    </div>
  );
}
