import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import Field from '../components/ui/Field';
import logo from '../assets/logo-header.png';
import './auth.css';

const RESEND_SECONDS = 60;

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const emailFailed = location.state?.emailSent === false;

  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(emailFailed ? 0 : RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await authApi.verifyEmail({ email, code });
      navigate('/ingresar', { state: { verified: true } });
    } catch (err) {
      setError(err.details?.length ? err.details.map((d) => d.message).join(' ') : err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    try {
      await authApi.resendVerification(email);
      setInfo('Si el correo corresponde a una cuenta pendiente, te enviamos un código nuevo.');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-card__brand"><img src={logo} alt="" className="auth-card__logo" /> PataHogar</div>
        <h1>Verificá tu correo</h1>
        <p className="auth-card__subtitle">
          {emailFailed
            ? 'No pudimos enviar el correo todavía. Tocá "Reenviar código" para intentarlo de nuevo.'
            : `Te enviamos un código de 6 dígitos${email ? ` a ${email}` : ''}. Ingresalo para activar tu cuenta.`}
        </p>

        {info && <div className="alert alert-success" style={{ marginBottom: 16 }}>{info}</div>}
        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Email" htmlFor="email">
            <input id="email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Código de verificación" htmlFor="code">
            <input
              id="code" className="input code-input" required autoFocus
              inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </Field>

          <button className="btn btn-primary btn-block" disabled={loading || code.length !== 6}>
            {loading ? 'Verificando…' : 'Verificar cuenta'}
          </button>
        </form>

        <p className="auth-card__footer">
          ¿No te llegó?{' '}
          <button type="button" className="link-btn" onClick={handleResend} disabled={cooldown > 0 || !email}>
            {cooldown > 0 ? `Reenviar código (${cooldown} s)` : 'Reenviar código'}
          </button>
        </p>
        <p className="auth-card__footer" style={{ marginTop: 8 }}>
          <Link to="/ingresar">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
