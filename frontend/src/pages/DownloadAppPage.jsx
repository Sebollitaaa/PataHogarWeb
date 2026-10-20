import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertIcon, ShieldIcon } from '../components/icons/Icons';
import './download-app.css';

// Datos del APK publicado. Al subir una versión nueva, se actualizan acá.
const APK = {
  version: '1.0',
  file: '/descargas/PataHogar-1.0.apk',
  size: '103 MB',
  sha256: '2d7aee16cea40f71eb3a3516fe143501530ac12433db4445cb56cfaf673b38f0',
};

function detectPlatform() {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
  const iPadOS = /Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOS ? 'ios' : 'android';
}

function Steps({ items }) {
  return (
    <ol className="app-steps">
      {items.map((item, i) => (
        <li key={i}>
          <span className="app-steps__num">{i + 1}</span>
          <div>
            <strong>{item.title}</strong>
            {item.text && <p>{item.text}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ShareGlyph() {
  return (
    <svg className="app-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 15V3m0 0L8 7m4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

function DotsGlyph() {
  return (
    <svg className="app-inline-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function DownloadAppPage() {
  const [platform, setPlatform] = useState(detectPlatform);

  return (
    <div className="container app-download">
      <header className="app-download__header">
        <h1>Llevá PataHogar en tu celular</h1>
        <p>Buscá mascotas, chateá con quienes las tienen en adopción y recibí avisos, todo desde la pantalla de inicio.</p>
      </header>

      <div className="app-download__tabs" role="tablist" aria-label="Sistema operativo">
        <button role="tab" aria-selected={platform === 'android'} className={platform === 'android' ? 'active' : ''} onClick={() => setPlatform('android')}>
          Android
        </button>
        <button role="tab" aria-selected={platform === 'ios'} className={platform === 'ios' ? 'active' : ''} onClick={() => setPlatform('ios')}>
          iPhone / iPad (iOS)
        </button>
      </div>

      {platform === 'android' && (
        <div className="app-download__panels">
          <section className="card app-panel">
            <h2>Opción 1: instalar la app (APK)</h2>
            <p className="app-panel__lead">La app nativa de PataHogar. Se descarga y se instala en unos minutos.</p>

            <div className="app-apk">
              <div>
                <strong>PataHogar para Android</strong>
                <span>Versión {APK.version} · {APK.size} · archivo .apk</span>
              </div>
              <a className="btn btn-primary" href={APK.file} download>
                Descargar APK
              </a>
            </div>

            <h3>Cómo instalarla</h3>
            <Steps
              items={[
                { title: 'Descargá el archivo desde tu celular', text: 'Tocá "Descargar APK". Si el navegador avisa que este tipo de archivo puede ser dañino, tocá "Descargar de todos modos".' },
                { title: 'Abrilo', text: 'Tocá la notificación de la descarga o buscá "PataHogar-1.0.apk" en la app Archivos, carpeta Descargas.' },
                { title: 'Permití instalar desde esta fuente', text: 'Android te va a pedir permiso para instalar apps desde el navegador (o desde Archivos). Activá "Permitir desde esta fuente", volvé atrás y tocá "Instalar".' },
                { title: 'Si aparece un aviso de Play Protect', text: 'Tocá "Más detalles" y después "Instalar de todas formas". Es normal: la app todavía no está publicada en Google Play.' },
                { title: 'Listo', text: 'Abrí PataHogar desde tu pantalla de inicio. Si querés, después podés volver a desactivar el permiso de instalar desde el navegador.' },
              ]}
            />

            <div className="app-note">
              <ShieldIcon size={18} />
              <div>
                <strong>Descargala solo desde esta página.</strong> Para verificar que el archivo es el original, su huella SHA-256 es:
                <code>{APK.sha256}</code>
              </div>
            </div>
          </section>

          <section className="card app-panel">
            <h2>Opción 2: agregar la web a la pantalla de inicio (PWA)</h2>
            <p className="app-panel__lead">Sin descargar nada: la página se abre como una app, con su ícono y a pantalla completa.</p>

            <h3>En Chrome</h3>
            <Steps
              items={[
                { title: <>Abrí <b>patahogar.online</b> en Chrome</> },
                { title: <>Tocá el menú <DotsGlyph /> arriba a la derecha</> },
                { title: <>Elegí <b>"Instalar app"</b> (o <b>"Agregar a la pantalla principal"</b>)</>, text: 'Confirmá con "Instalar". El ícono de PataHogar aparece junto a tus otras apps.' },
              ]}
            />

            <h3>En Samsung Internet</h3>
            <Steps
              items={[
                { title: 'Abrí patahogar.online en Samsung Internet' },
                { title: 'Tocá el menú ≡ de abajo a la derecha' },
                { title: 'Elegí "Agregar página a" y después "Pantalla de inicio"' },
              ]}
            />
          </section>
        </div>
      )}

      {platform === 'ios' && (
        <div className="app-download__panels">
          <section className="card app-panel">
            <h2>Agregar PataHogar a la pantalla de inicio (PWA)</h2>
            <p className="app-panel__lead">
              En iPhone y iPad no se pueden instalar archivos APK ni apps que no sean del App Store.
              La forma de tener PataHogar como una app es agregar la web a la pantalla de inicio:
              se abre a pantalla completa y con su propio ícono.
            </p>

            <Steps
              items={[
                { title: <>Abrí <b>patahogar.online</b> en <b>Safari</b></>, text: 'Tiene que ser Safari, el navegador de Apple. Desde otros navegadores la opción puede no aparecer.' },
                { title: <>Tocá el botón <b>Compartir</b> <ShareGlyph /></>, text: 'Es el cuadrado con una flecha hacia arriba, abajo en el centro de la pantalla (en iPad, arriba a la derecha).' },
                { title: <>Deslizá hacia abajo y tocá <b>"Agregar a inicio"</b></>, text: 'Si no la ves, tocá "Ver más" o bajá hasta el final de la lista de opciones.' },
                { title: 'Confirmá el nombre', text: 'Dejá "PataHogar" y tocá "Agregar", arriba a la derecha.' },
                { title: 'Listo', text: 'El ícono de PataHogar aparece en tu pantalla de inicio. Abrilo desde ahí, como cualquier otra app.' },
              ]}
            />

            <div className="app-note app-note--info">
              <AlertIcon size={18} />
              <div>
                Para recibir avisos y mantener la sesión iniciada, abrí siempre PataHogar desde el ícono de la pantalla de inicio.
              </div>
            </div>
          </section>
        </div>
      )}

      <p className="app-download__back">
        <Link to="/">← Volver al inicio</Link>
      </p>
    </div>
  );
}
