import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, SearchIcon } from '../components/icons/Icons';
import './not-found.css';

/**
 * Página de error 404. También se usa cuando una publicación o un perfil
 * no existen (con otro título y mensaje).
 */
export default function NotFoundPage({
  title = 'Esta página se escapó',
  message = 'Buscamos por todos lados pero el enlace al que intentaste entrar no existe o ya no está disponible.',
}) {
  const navigate = useNavigate();

  return (
    <div className="container not-found">
      <div className="not-found__art" aria-hidden="true">
        <span className="not-found__digit">4</span>
        <svg className="not-found__paw" viewBox="0 0 24 24">
          <ellipse cx="5.3" cy="10.6" rx="1.6" ry="2.1" transform="rotate(-22 5.3 10.6)" />
          <ellipse cx="9.3" cy="6.6" rx="1.7" ry="2.3" transform="rotate(-8 9.3 6.6)" />
          <ellipse cx="14.7" cy="6.6" rx="1.7" ry="2.3" transform="rotate(8 14.7 6.6)" />
          <ellipse cx="18.7" cy="10.6" rx="1.6" ry="2.1" transform="rotate(22 18.7 10.6)" />
          <path d="M12 12.2c-3 0-5.5 2.4-5.5 5 0 1.6 1.2 2.6 2.7 2.3 1.1-.2 1.8-.8 2.8-.8s1.7.6 2.8.8c1.5.3 2.7-.7 2.7-2.3 0-2.6-2.5-5-5.5-5Z" />
        </svg>
        <span className="not-found__digit">4</span>
      </div>

      <div className="not-found__trail" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 24 24" style={{ animationDelay: `${i * 0.25}s` }}>
            <ellipse cx="7" cy="9" rx="2" ry="2.6" />
            <ellipse cx="12" cy="6.5" rx="2" ry="2.6" />
            <ellipse cx="17" cy="9" rx="2" ry="2.6" />
            <path d="M12 12c-3 0-5.5 2.3-5.5 5 0 1.6 1.2 2.6 2.7 2.3 1.1-.2 1.8-.8 2.8-.8s1.7.6 2.8.8c1.5.3 2.7-.7 2.7-2.3 0-2.7-2.5-5-5.5-5Z" />
          </svg>
        ))}
      </div>

      <h1>{title}</h1>
      <p>{message}</p>

      <div className="not-found__actions">
        <Link to="/" className="btn btn-primary">
          <SearchIcon size={16} /> Buscar mascotas
        </Link>
        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
          <ArrowLeftIcon size={16} /> Volver atrás
        </button>
      </div>
    </div>
  );
}
