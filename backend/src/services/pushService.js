const webpush = require('web-push');
const env = require('../config/env');
const logger = require('../utils/logger');
const pushRepository = require('../models/pushRepository');

const enabled = Boolean(env.push.publicKey && env.push.privateKey);

if (enabled) {
  webpush.setVapidDetails(env.push.subject, env.push.publicKey, env.push.privateKey);
} else {
  logger.warn('Notificaciones push desactivadas: faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.');
}

function isEnabled() {
  return enabled;
}

/**
 * Envía una notificación push a todos los dispositivos de un usuario.
 * `payload`: { title, body, url, tag?, urgency? }. Los dispositivos que ya no existen
 * (el navegador responde 404 / 410) se borran solos. Nunca lanza: un push que falla
 * no debe romper el envío de un mensaje ni la creación de una notificación.
 */
async function sendToUser(userId, payload) {
  if (!enabled) return { sent: 0, removed: 0 };

  let subscriptions;
  try {
    subscriptions = await pushRepository.findByUser(userId);
  } catch (err) {
    logger.warn(`Push: no se pudieron leer las suscripciones de ${userId}: ${err.message}`);
    return { sent: 0, removed: 0 };
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
    tag: payload.tag,
  });

  let sent = 0;
  let removed = 0;
  await Promise.all(subscriptions.map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
        { TTL: 60 * 60 * 24, urgency: payload.urgency || 'normal' }
      );
      sent += 1;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await pushRepository.removeById(s.id).catch(() => {});
        removed += 1;
      } else {
        logger.warn(`Push: falló un envío a ${userId} (${err.statusCode || err.code || err.message})`);
      }
    }
  }));

  if (subscriptions.length > 0) logger.info(`Push al usuario ${userId}: ${sent} enviados, ${removed} dispositivos dados de baja (de ${subscriptions.length}).`);
  return { sent, removed };
}

/** ¿El usuario tiene abierta, en pantalla, esa conversación? Entonces no hace falta avisarle. */
async function isViewingConversation(io, userId, conversationId) {
  if (!io) return false;
  try {
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    return sockets.some((s) => s.data.viewing && String(s.data.viewing) === String(conversationId));
  } catch {
    return false;
  }
}

module.exports = { isEnabled, sendToUser, isViewingConversation };
