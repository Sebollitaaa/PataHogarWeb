const db = require('../db/knex');
const userRepository = require('../models/userRepository');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

const POLL_INTERVAL_MS = 15000;

/**
 * La desktop app aprueba/rechaza solicitudes escribiendo directo en MySQL
 * (verification_requests.status), sin pasar por esta API. Este poller revisa
 * periódicamente qué solicitudes quedaron resueltas y todavía no se procesaron
 * del lado de la web: le pone la insignia de verificado al usuario si corresponde
 * y le manda una notificación in-app. `user_notified_at` evita procesar dos veces.
 */
async function processResolvedRequests(io) {
  const resolved = await db('verification_requests')
    .whereIn('status', ['aprobada', 'rechazada'])
    .whereNull('user_notified_at');

  for (const request of resolved) {
    if (request.status === 'aprobada') {
      await userRepository.update(request.user_id, { is_verified_organization: true });
      await notificationService.create(io, {
        user_id: request.user_id,
        type: 'verification_approved',
        payload: { organizationName: request.organization_name },
      });
    } else {
      await notificationService.create(io, {
        user_id: request.user_id,
        type: 'verification_rejected',
        payload: { organizationName: request.organization_name, reason: request.rejection_reason },
      });
    }

    await db('verification_requests').where({ id: request.id }).update({ user_notified_at: new Date() });
  }
}

function startVerificationSync(io) {
  const tick = () => processResolvedRequests(io).catch((err) => logger.error('Error sincronizando solicitudes de verificación:', err));
  tick();
  setInterval(tick, POLL_INTERVAL_MS);
}

module.exports = { startVerificationSync };
