import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enablePush, pushPrefs, pushSupport, registerServiceWorker, syncDeviceWithAccount } from '../utils/push';
import { BellIcon, XIcon } from './icons/Icons';
import './push-boot.css';

/**
 * Se encarga de las notificaciones push en segundo plano:
 *  - registra el service worker,
 *  - vincula este dispositivo con la cuenta al iniciar sesión,
 *  - navega cuando se toca una notificación con la página ya abierta,
 *  - ofrece activarlas (un aviso que se puede cerrar).
 */
export default function PushBoot() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    function onMessage(event) {
      if (event.data?.type === 'navigate' && typeof event.data.url === 'string') navigate(event.data.url);
    }
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowPrompt(false);
      return;
    }
    syncDeviceWithAccount();
    const canAsk = pushSupport() === 'ok'
      && Notification.permission === 'default'
      && !pushPrefs.isDismissed()
      && !pushPrefs.isOff();
    setShowPrompt(canAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  if (!showPrompt) return null;

  async function activate() {
    setBusy(true);
    try {
      await enablePush();
    } catch {
      // el detalle se ve en Mi cuenta → Notificaciones
    } finally {
      setBusy(false);
      setShowPrompt(false);
    }
  }

  function dismiss() {
    pushPrefs.dismiss();
    setShowPrompt(false);
  }

  return (
    <div className="push-prompt" role="region" aria-label="Notificaciones">
      <span className="push-prompt__icon"><BellIcon size={20} /></span>
      <div className="push-prompt__text">
        <strong>¿Querés enterarte al instante?</strong>
        <span>Activá las notificaciones para saber cuándo te escriben, aunque no tengas PataHogar abierto.</span>
      </div>
      <div className="push-prompt__actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={activate} disabled={busy}>Activar</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={dismiss}>Ahora no</button>
      </div>
      <button type="button" className="push-prompt__close" onClick={dismiss} aria-label="Cerrar"><XIcon size={16} /></button>
    </div>
  );
}
