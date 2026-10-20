const ApiError = require('../utils/ApiError');
const conversationRepository = require('../models/conversationRepository');
const messageRepository = require('../models/messageRepository');
const chatImageService = require('./chatImageService');
const petRepository = require('../models/petRepository');
const userRepository = require('../models/userRepository');
const pushService = require('./pushService');
const logger = require('../utils/logger');

function serializeAttachment(a) {
  return { id: a.id, width: a.width, height: a.height };
}

/**
 * `attachments` son las filas de message_attachments del mensaje. Un mensaje
 * retirado por un moderador conserva su lugar en el historial pero sin contenido.
 */
function serializeMessage(m, attachments = m.attachments || []) {
  const removed = Boolean(m.removed_at);
  return {
    id: m.id,
    conversationId: m.conversation_id,
    senderId: m.sender_id,
    content: removed ? null : m.content,
    attachments: removed ? [] : attachments.map(serializeAttachment),
    removed,
    createdAt: m.created_at,
    readAt: m.read_at,
  };
}

/** Serializa una lista de mensajes consultando sus adjuntos de una sola vez. */
async function serializeMessages(rows) {
  const attachments = await messageRepository.findAttachmentsForMessages(rows.map((m) => m.id));
  const byMessage = {};
  for (const a of attachments) {
    if (!byMessage[a.message_id]) byMessage[a.message_id] = [];
    byMessage[a.message_id].push(a);
  }
  return rows.map((m) => serializeMessage(m, byMessage[m.id] || []));
}

/** Texto corto para la lista de conversaciones. */
function previewOf(message, attachmentCount = 0) {
  if (message.removed_at) return 'Mensaje eliminado';
  if (message.content) return message.content.slice(0, 120);
  return attachmentCount > 1 ? `📷 ${attachmentCount} fotos` : '📷 Foto';
}

/**
 * Aviso push al destinatario, como WhatsApp: "Nombre" y el texto del mensaje.
 * No se manda si en ese momento tiene abierta esa misma conversación.
 */
async function notifyRecipient(io, { convo, message, senderId, recipientId }) {
  try {
    if (!pushService.isEnabled()) return;
    if (await pushService.isViewingConversation(io, recipientId, convo.id)) return;

    const sender = await userRepository.findById(senderId);
    const photos = message.attachments ? message.attachments.length : 0;
    const text = (message.content || '').replace(/\s+/g, ' ').trim();
    const body = text
      ? (text.length > 140 ? `${text.slice(0, 137)}…` : text)
      : (photos > 1 ? `📷 ${photos} fotos` : '📷 Foto');

    await pushService.sendToUser(recipientId, {
      title: sender ? `${sender.first_name} ${sender.last_name}`.trim() : 'PataHogar',
      body,
      url: `/mensajes/${convo.id}`,
      tag: `chat-${convo.id}`,
      urgency: 'high',
    });
  } catch (err) {
    logger.warn(`Push de mensaje falló: ${err.message}`);
  }
}

/**
 * Punto único para enviar un mensaje, usado tanto por el endpoint REST como
 * por el handler de Socket.io, así la notificación y el broadcast nunca se duplican ni se olvidan.
 * `files`: buffers de imagen ya recibidos por multer (opcional).
 */
async function sendMessage(io, { conversationId, senderId, content, files = [] }) {
  const trimmed = (content || '').trim();
  if (!trimmed && files.length === 0) throw new ApiError(422, 'El mensaje no puede estar vacío.');
  if (trimmed.length > 2000) throw new ApiError(422, 'El mensaje es demasiado largo.');

  const convo = await conversationRepository.findById(conversationId);
  if (!convo) throw new ApiError(404, 'Conversación no encontrada.');
  if (!conversationRepository.isParticipant(convo, senderId)) {
    throw new ApiError(403, 'No participás de esta conversación.');
  }

  const recipientId = Number(convo.user_a_id) === Number(senderId) ? convo.user_b_id : convo.user_a_id;

  // Las imágenes se validan y guardan antes de crear el mensaje: si alguna falla, no queda nada a medias.
  const saved = files.length > 0 ? await chatImageService.saveImages(convo.id, files) : [];

  let messageId;
  try {
    messageId = await messageRepository.create({ conversation_id: convo.id, sender_id: senderId, content: trimmed });
    await messageRepository.addAttachments(messageId, saved);
  } catch (err) {
    await chatImageService.deleteFiles(convo.id, saved.flatMap((s) => [s.thumbFile, s.mediumFile]));
    throw err;
  }

  await conversationRepository.touchLastMessage(convo.id);
  await conversationRepository.reviveForRecipient(convo.id, recipientId);

  const message = await messageRepository.findById(messageId);
  message.attachments = await messageRepository.findAttachmentsForMessages([messageId]);

  const payload = { conversationId: convo.id, message: serializeMessage(message) };
  if (io) {
    io.to(`user:${recipientId}`).emit('message:new', payload);
    io.to(`user:${senderId}`).emit('message:new', payload);
  }

  await notifyRecipient(io, { convo, message, senderId, recipientId });

  return message;
}

/**
 * Crea (o recupera) la conversación entre el usuario y el dueño de la mascota,
 * y opcionalmente manda el primer mensaje. Así se cumple la regla de que el
 * chat nace la primera vez que alguien escribe por esa mascota puntual.
 */
async function startConversation(io, { petId, userId, content }) {
  const pet = await petRepository.findById(petId);
  if (!pet) throw new ApiError(404, 'Publicación no encontrada.');
  if (Number(pet.owner_id) === Number(userId)) {
    throw new ApiError(400, 'No podés iniciar un chat sobre tu propia publicación.');
  }

  const convo = await conversationRepository.findOrCreate(pet.id, userId, pet.owner_id);
  await conversationRepository.reviveForUser(convo.id, userId);

  let message = null;
  if (content) {
    message = await sendMessage(io, { conversationId: convo.id, senderId: userId, content });
  }

  return { conversation: convo, message };
}

module.exports = { sendMessage, startConversation, serializeMessage, serializeMessages, previewOf };
