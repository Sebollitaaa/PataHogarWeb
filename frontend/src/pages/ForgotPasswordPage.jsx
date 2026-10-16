import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import Field from '../components/ui/Field';
import logo from '../assets/logo-header.png';
import './auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      navigate(`/restablecer-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.details?.length ? err.details.map((d) => d.message).join(' ') : err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-card__brand"><img src={logo} alt="" className="auth-card__logo" /> PataHogar</div>
        <h1>Recuperá tu contraseña</h1>
        <p className="auth-card__subtitle">
          Ingresá el correo de tu cuenta y te enviamos un código para elegir una contraseña nueva.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <Field label="Email" htmlFor="email">
            <input id="email" type="email" className="input" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar código'}
          </button>
        </form>

        <p className="auth-card__footer">
          <Link to="/ingresar">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
