const notificationRepository = require('../models/notificationRepository');
const pushService = require('./pushService');
const logger = require('../utils/logger');
const { notificationText, notificationLink } = require('../utils/notificationText');

function serialize(n) {
  return {
    id: n.id,
    type: n.type,
    payload: typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload,
    isRead: Boolean(n.is_read),
    createdAt: n.created_at,
  };
}

async function create(io, entry) {
  const id = await notificationRepository.create(entry);
  const notification = await notificationRepository.findById(id);

  if (io) {
    io.to(`user:${entry.user_id}`).emit('notification:new', serialize(notification));
  }

  // Además del aviso dentro de la página, se manda un push por si no tiene la web abierta.
  try {
    await pushService.sendToUser(entry.user_id, {
      title: 'PataHogar',
      body: notificationText(notification),
      url: notificationLink(notification),
      tag: `notif-${notification.id}`,
    });
  } catch (err) {
    logger.warn(`Push de notificación falló: ${err.message}`);
  }

  return notification;
}

module.exports = { create, serialize };
