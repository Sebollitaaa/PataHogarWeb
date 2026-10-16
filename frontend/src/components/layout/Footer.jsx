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
        <p className="site-footer__copy">PataHogar — plataforma de adopción de mascotas.</p>
      </div>
    </footer>
  );
}
