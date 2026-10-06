import { Link } from 'react-router-dom';
import './footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__cta">
          <div>
            <strong>¿Tenés un refugio?</strong>
            <p>Solicitá tu verificación para recibir beneficios exclusivos.</p>
          </div>
          <Link to="/solicitar-verificacion" className="btn btn-primary btn-sm">
            Solicitar verificación
          </Link>
        </div>
        <p className="site-footer__copy">PataHogar — plataforma de adopción de mascotas.</p>
      </div>
    </footer>
  );
}
