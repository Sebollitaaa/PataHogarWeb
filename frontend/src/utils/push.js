import { pushApi } from '../api/push';

const PREF_KEY = 'patahogar:push'; // 'off' = la persona las desactivó; 'dismissed' = cerró el aviso sin elegir

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY);
  } catch {
    return null;
  }
}

function writePref(value) {
  try {
    if (value === null) localStorage.removeItem(PREF_KEY);
    else localStorage.setItem(PREF_KEY, value);
  } catch {
    // sin almacenamiento: solo no se recuerda la preferencia
  }
}

export const pushPrefs = {
  isOff: () => readPref() === 'off',
  isDismissed: () => readPref() === 'dismissed',
  dismiss: () => writePref('dismissed'),
};

function isIOS() {
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}

/**
 * 'ok'          → se pueden activar.
 * 'ios-install' → iPhone/iPad: hace falta agregar la web a la pantalla de inicio primero.
 * 'unsupported' → este navegador no soporta notificaciones push.
 */
export function pushSupport() {
  const hasApis = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (hasApis) return 'ok';
  return isIOS() && !isStandalone() ? 'ios-install' : 'unsupported';
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Registro del service worker; si ya estaba instalado se reutiliza sin volver a registrarlo. */
async function getRegistration() {
  let reg = await navigator.serviceWorker.getRegistration('/');
  if (!reg) reg = await navigator.serviceWorker.register('/sw.js');
  if (reg.active) return reg;
  return navigator.serviceWorker.ready;
}

/** Suscripción de este dispositivo en el navegador (o null). */
export async function currentSubscription() {
  if (pushSupport() !== 'ok') return null;
  const reg = await getRegistration();
  return reg.pushManager.getSubscription();
}

/** Pide permiso (si hace falta), se suscribe y registra el dispositivo en el servidor. */
export async function enablePush() {
  if (pushSupport() !== 'ok') throw new Error('Este dispositivo no permite notificaciones.');

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') {
    if (permission === 'denied') writePref('off');
    return permission;
  }

  const reg = await getRegistration();
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await pushApi.publicKey();
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
  }
  await pushApi.subscribe(sub.toJSON());
  writePref(null);
  return 'granted';
}

/** La persona desactiva las notificaciones en este dispositivo. */
export async function disablePush() {
  writePref('off');
  const sub = await currentSubscription();
  if (!sub) return;
  try {
    await pushApi.unsubscribe(sub.endpoint);
  } finally {
    await sub.unsubscribe();
  }
}

/**
 * Al iniciar sesión: si la persona ya había dado permiso y no las desactivó,
 * se vincula este dispositivo a la cuenta actual (sirve también si se cambia de cuenta
 * en el mismo navegador).
 */
export async function syncDeviceWithAccount() {
  if (pushSupport() !== 'ok' || Notification.permission !== 'granted' || pushPrefs.isOff()) return;
  try {
    await enablePush();
  } catch {
    // sin conexión o servidor sin push: se reintenta en el próximo inicio
  }
}

/** Al cerrar sesión: este dispositivo deja de recibir los avisos de esa cuenta. */
export async function unlinkDeviceFromAccount() {
  try {
    const sub = await currentSubscription();
    if (sub) await pushApi.unsubscribe(sub.endpoint);
  } catch {
    // no impide cerrar sesión
  }
}
