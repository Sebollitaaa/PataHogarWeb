import { Link, useLocation } from 'react-router-dom';
import './footer.css';

export default function Footer() {
  const { pathname } = useLocation();
  // El chat ocupa toda la pantalla, como en una app de mensajería: sin pie de página.
  if (pathname.startsWith('/mensajes')) return null;
  const showCta = pathname !== '/solicitar-verificacion';

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        {showCta && (
        <div className="site-footer__cta">
          <div>
            <strong>¿Tenés un refugio?</strong>
            <p>Solicitá tu verificación para recibir beneficios exclusivos.</p>
          </div>
          <Link to="/solicitar-verificacion" className="btn btn-primary btn-sm">
            Solicitar verificación
          </Link>
        </div>
        )}
        <div className="site-footer__bottom">
          <p className="site-footer__copy">PataHogar — plataforma de adopción de mascotas.</p>
          <nav className="site-footer__links" aria-label="Enlaces del pie de página">
            <Link to="/descargar" className="site-footer__app">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
                <path d="M12 8v6m0 0-2.4-2.4M12 14l2.4-2.4" />
              </svg>
              Descargar la app
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
