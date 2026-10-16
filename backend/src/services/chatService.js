const ApiError = require('../utils/ApiError');
const conversationRepository = require('../models/conversationRepository');
const messageRepository = require('../models/messageRepository');
const notificationService = require('./notificationService');
const chatImageService = require('./chatImageService');
const petRepository = require('../models/petRepository');

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
  const pet = await petRepository.findById(convo.pet_id);

  const notifType = pet && Number(pet.owner_id) === Number(recipientId) ? 'new_message_on_your_pet' : 'reply_to_inquiry';
  await notificationService.create(io, {
    user_id: recipientId,
    type: notifType,
    payload: { conversationId: convo.id, petId: convo.pet_id, petName: pet ? pet.name : null, senderId: Number(senderId) },
  });

  const payload = { conversationId: convo.id, message: serializeMessage(message) };
  if (io) {
    io.to(`user:${recipientId}`).emit('message:new', payload);
    io.to(`user:${senderId}`).emit('message:new', payload);
  }

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
