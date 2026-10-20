const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const pushRepository = require('../models/pushRepository');
const pushService = require('../services/pushService');

/** Clave pública que el navegador necesita para suscribirse (no es un secreto). */
function publicKey(req, res) {
  if (!pushService.isEnabled()) throw new ApiError(503, 'Las notificaciones push no están disponibles en este servidor.');
  res.json({ publicKey: env.push.publicKey });
}

async function subscribe(req, res) {
  const { endpoint, keys } = req.body;
  await pushRepository.upsert(req.user.id, { endpoint, keys }, req.headers['user-agent']);
  res.status(201).json({ message: 'Notificaciones activadas en este dispositivo.' });
}

async function unsubscribe(req, res) {
  await pushRepository.removeByEndpoint(req.user.id, req.body.endpoint);
  res.json({ message: 'Notificaciones desactivadas en este dispositivo.' });
}

/** Envía una notificación de prueba a todos los dispositivos del usuario. */
async function test(req, res) {
  if ((await pushRepository.countByUser(req.user.id)) === 0) {
    throw new ApiError(409, 'Todavía no activaste las notificaciones en ningún dispositivo.');
  }
  const result = await pushService.sendToUser(req.user.id, {
    title: 'PataHogar',
    body: '¡Funciona! Así vas a recibir los avisos en este dispositivo.',
    url: '/',
    tag: 'prueba',
  });
  res.json(result);
}

module.exports = { publicKey, subscribe, unsubscribe, test };
