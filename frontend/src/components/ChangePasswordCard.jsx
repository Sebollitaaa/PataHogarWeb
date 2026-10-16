import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import Field from './ui/Field';
import PasswordInput from './PasswordInput';
import PasswordRequirements from './PasswordRequirements';
import { isPasswordValid } from '../utils/passwordRules';

/**
 * Cambio de contraseña con la sesión iniciada. Para confirmar que es la persona
 * dueña de la cuenta se pide un código que llega al correo (no la contraseña actual).
 * Pasos: 'idle' → 'code' (código enviado) → 'done'.
 */
export default function ChangePasswordCard() {
  const [step, setStep] = useState('idle');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function showError(err) {
    setError(err.details?.length ? err.details.map((d) => d.message).join(' ') : err.message);
  }

  async function sendCode() {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.requestPasswordCode();
      setMaskedEmail(res.email);
      setStep('code');
      setCooldown(60);
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

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
      await authApi.changePassword({ code, newPassword, confirmNewPassword: confirm });
      setStep('done');
      setCode('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card profile-card profile-card--security">
      <h2>Seguridad</h2>

      {step === 'done' && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          Contraseña actualizada. Cerramos tu sesión en los otros dispositivos; en este seguís conectado.
        </div>
      )}
      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {(step === 'idle' || step === 'done') && (
        <>
          <p className="profile-security__text">
            Para cambiar tu contraseña te enviamos un código de 6 dígitos al correo de tu cuenta.
          </p>
          <button type="button" className="btn btn-outline" onClick={sendCode} disabled={loading}>
            {loading ? 'Enviando…' : 'Cambiar contraseña'}
          </button>
        </>
      )}

      {step === 'code' && (
        <form onSubmit={handleSubmit}>
          <p className="profile-security__text">
            Enviamos un código a <strong>{maskedEmail}</strong>. Vence en 15 minutos.
          </p>
          <Field label="Código" htmlFor="changeCode">
            <input
              id="changeCode" className="input code-input" required autoFocus
              inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </Field>
          <Field label="Nueva contraseña" htmlFor="changeNewPassword">
            <PasswordInput id="changeNewPassword" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <PasswordRequirements value={newPassword} />
          <Field
            label="Confirmar nueva contraseña" htmlFor="changeConfirm"
            error={confirm && newPassword !== confirm ? 'Las contraseñas no coinciden.' : undefined}
          >
            <PasswordInput id="changeConfirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>

          <button className="btn btn-primary btn-block" disabled={loading || code.length !== 6}>
            {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
          </button>
          <p className="profile-security__resend">
            ¿No llegó?{' '}
            <button type="button" className="link-btn" onClick={sendCode} disabled={loading || cooldown > 0}>
              {cooldown > 0 ? `Reenviar código (${cooldown} s)` : 'Reenviar código'}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
