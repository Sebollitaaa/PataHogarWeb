import { useCallback, useEffect, useState } from 'react';
import { pushApi } from '../api/push';
import { currentSubscription, disablePush, enablePush, pushSupport } from '../utils/push';

/**
 * Tarjeta de "Mi cuenta": activar o desactivar las notificaciones en este dispositivo.
 * Cada dispositivo (celular, computadora) se activa por separado.
 */
export default function PushSettings() {
  const support = pushSupport();
  const [state, setState] = useState('loading'); // loading | on | off | denied
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (support !== 'ok') return;
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    // Si el navegador tarda en responder, se muestra el botón igual (estado "desactivado").
    const sub = await Promise.race([
      currentSubscription().catch(() => null),
      new Promise((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
    setState(sub && Notification.permission === 'granted' ? 'on' : 'off');
  }, [support]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggle() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      if (state === 'on') {
        await disablePush();
        setMessage('Notificaciones desactivadas en este dispositivo.');
      } else {
        const result = await enablePush();
        if (result === 'granted') setMessage('¡Listo! Vas a recibir los avisos en este dispositivo.');
      }
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la configuración.');
    } finally {
      await refresh();
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage('');
    setError('');
    try {
      await pushApi.test();
      setMessage('Te enviamos una notificación de prueba. Si no aparece en unos segundos, revisá los permisos del sistema.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card profile-card profile-card--security">
      <h2>Notificaciones</h2>

      {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
      {message && <div className="alert alert-success" style={{ marginBottom: 12 }}>{message}</div>}

      {support === 'ios-install' && (
        <p className="profile-security__text">
          En iPhone y iPad las notificaciones funcionan solo si agregás PataHogar a la pantalla de inicio
          (necesitás iOS 16.4 o más). Seguí los pasos de <a href="/descargar">Descargar la app</a>, abrí PataHogar desde su
          ícono y volvé a esta pantalla para activarlas.
        </p>
      )}

      {support === 'unsupported' && (
        <p className="profile-security__text">Este navegador no permite recibir notificaciones. Probá con Chrome, Edge o Firefox.</p>
      )}

      {support === 'ok' && (
        <>
          <p className="profile-security__text">
            Recibí un aviso en este dispositivo cuando te escriban o pase algo con tus publicaciones, aunque no tengas PataHogar abierto.
          </p>

          {state === 'denied' ? (
            <p className="profile-security__text">
              Las notificaciones están <strong>bloqueadas</strong> en este navegador. Para activarlas, habilitá el permiso de
              notificaciones de PataHogar en la configuración del sitio (el candado junto a la dirección) y recargá la página.
            </p>
          ) : (
            <div className="push-settings__actions">
              <button type="button" className={state === 'on' ? 'btn btn-outline' : 'btn btn-primary'} onClick={toggle} disabled={busy || state === 'loading'}>
                {state === 'on' ? 'Desactivar en este dispositivo' : 'Activar en este dispositivo'}
              </button>
              {state === 'on' && (
                <button type="button" className="btn btn-ghost" onClick={sendTest} disabled={busy}>
                  Enviar notificación de prueba
                </button>
              )}
            </div>
          )}
          {state === 'on' && <p className="field-hint" style={{ marginTop: 10 }}>Activadas en este dispositivo.</p>}
        </>
      )}
    </div>
  );
}
