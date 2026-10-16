const ApiError = require('../utils/ApiError');
const db = require('../db/knex');
const conversationRepository = require('../models/conversationRepository');
const messageRepository = require('../models/messageRepository');
const notificationRepository = require('../models/notificationRepository');
const chatService = require('../services/chatService');
const chatImageService = require('../services/chatImageService');
const messageReportRepository = require('../models/messageReportRepository');

async function start(req, res) {
  const io = req.app.get('io');
  const { conversation, message } = await chatService.startConversation(io, {
    petId: req.body.petId,
    userId: req.user.id,
    content: req.body.content,
  });
  res.status(201).json({ conversationId: conversation.id, message: message ? chatService.serializeMessage(message) : null });
}

async function list(req, res) {
  const userId = req.user.id;
  const rows = await conversationRepository.listForUser(userId);
  const convoIds = rows.map((r) => r.id);

  const [unreadRows, lastMessages] = await Promise.all([
    messageRepository.unreadCountsForConversations(convoIds, userId),
    messageRepository.lastMessageForConversations(convoIds),
  ]);
  const unreadMap = Object.fromEntries(unreadRows.map((r) => [r.conversation_id, Number(r.count)]));
  const lastMsgMap = Object.fromEntries(lastMessages.map((m) => [m.conversation_id, m]));
  const lastAttachments = await messageRepository.findAttachmentsForMessages(lastMessages.map((m) => m.id));
  const attachmentCount = {};
  for (const a of lastAttachments) attachmentCount[a.message_id] = (attachmentCount[a.message_id] || 0) + 1;

  const counterpartIds = [...new Set(rows.map((r) => (Number(r.user_a_id) === Number(userId) ? r.user_b_id : r.user_a_id)))];
  const counterparts = counterpartIds.length
    ? await db('users').whereIn('id', counterpartIds).select('id', 'first_name', 'last_name', 'profile_photo_url', 'is_verified_organization')
    : [];
  const counterpartMap = Object.fromEntries(counterparts.map((u) => [u.id, u]));

  const grouped = {};
  for (const row of rows) {
    const counterpartId = Number(row.user_a_id) === Number(userId) ? row.user_b_id : row.user_a_id;
    if (!grouped[counterpartId]) {
      const u = counterpartMap[counterpartId] || {};
      grouped[counterpartId] = {
        counterpart: {
          id: counterpartId, firstName: u.first_name, lastName: u.last_name, profilePhotoUrl: u.profile_photo_url,
          isVerifiedOrganization: Boolean(u.is_verified_organization),
        },
        chats: [],
      };
    }
    const lastMsg = lastMsgMap[row.id];
    const isSideA = conversationRepository.sideOf(row, userId) === 'a';
    grouped[counterpartId].chats.push({
      conversationId: row.id,
      petId: row.pet_id,
      petName: row.pet_name,
      petStatus: row.pet_status,
      archived: isSideA ? Boolean(row.archived_by_a) : Boolean(row.archived_by_b),
      lastMessageAt: row.last_message_at,
      lastMessagePreview: lastMsg ? chatService.previewOf(lastMsg, attachmentCount[lastMsg.id] || 0) : null,
      unreadCount: unreadMap[row.id] || 0,
    });
  }

  res.json({ conversations: Object.values(grouped) });
}

async function getMessages(req, res) {
  const convo = await conversationRepository.findById(req.params.id);
  if (!convo) throw new ApiError(404, 'Conversación no encontrada.');
  if (!conversationRepository.isParticipant(convo, req.user.id)) throw new ApiError(403, 'No participás de esta conversación.');

  const beforeId = req.query.beforeId ? parseInt(req.query.beforeId, 10) : undefined;
  const messages = await messageRepository.findByConversation(convo.id, { beforeId, limit: 30 });

  if (!beforeId) {
    await messageRepository.markAllRead(convo.id, req.user.id);
    await notificationRepository.markReadByConversation(req.user.id, convo.id);
  }

  res.json({ messages: await chatService.serializeMessages(messages.reverse()) });
}

async function sendMessage(req, res) {
  const convo = await conversationRepository.findById(req.params.id);
  if (!convo) throw new ApiError(404, 'Conversación no encontrada.');

  const io = req.app.get('io');
  const message = await chatService.sendMessage(io, {
    conversationId: convo.id,
    senderId: req.user.id,
    content: req.body.content,
    files: (req.files || []).map((f) => f.buffer),
  });
  res.status(201).json({ message: chatService.serializeMessage(message) });
}

async function setArchived(req, res) {
  const convo = await conversationRepository.findById(req.params.id);
  if (!convo) throw new ApiError(404, 'Conversación no encontrada.');
  if (!conversationRepository.isParticipant(convo, req.user.id)) throw new ApiError(403, 'No participás de esta conversación.');

  await conversationRepository.setArchived(convo.id, req.user.id, Boolean(req.body.archived));
  res.json({ message: 'Listo.' });
}

async function remove(req, res) {
  const convo = await conversationRepository.findById(req.params.id);
  if (!convo) throw new ApiError(404, 'Conversación no encontrada.');
  if (!conversationRepository.isParticipant(convo, req.user.id)) throw new ApiError(403, 'No participás de esta conversación.');

  await conversationRepository.setDeleted(convo.id, req.user.id);
  res.json({ message: 'Conversación eliminada de tu lista.' });
}

/**
 * Entrega una foto del chat. No es una URL pública: solo la ven quienes participan
 * de la conversación (o un moderador, y únicamente si el mensaje fue reportado).
 */
async function getAttachment(req, res) {
  const attachment = await messageRepository.findAttachmentById(req.params.attachmentId);
  if (!attachment || attachment.removed_at) throw new ApiError(404, 'Archivo no encontrado.');

  const convo = await conversationRepository.findById(attachment.conversation_id);
  const isParticipant = convo && conversationRepository.isParticipant(convo, req.user.id);
  const isModerator = req.user.role === 'admin' && (await messageReportRepository.hasReportForMessage(attachment.message_id));
  if (!isParticipant && !isModerator) throw new ApiError(404, 'Archivo no encontrado.');

  const fileName = req.params.variant === 'thumb' ? attachment.thumb_file : attachment.medium_file;
  res.set('Cache-Control', 'private, max-age=3600');
  res.set('X-Content-Type-Options', 'nosniff');
  res.type('image/jpeg');
  res.sendFile(chatImageService.filePath(attachment.conversation_id, fileName), (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: { message: 'Archivo no encontrado.' } });
  });
}

async function reportMessage(req, res) {
  const message = await messageRepository.findById(req.params.messageId);
  if (!message) throw new ApiError(404, 'Mensaje no encontrado.');

  const convo = await conversationRepository.findById(message.conversation_id);
  if (!convo || !conversationRepository.isParticipant(convo, req.user.id)) {
    throw new ApiError(404, 'Mensaje no encontrado.');
  }
  if (Number(message.sender_id) === Number(req.user.id)) {
    throw new ApiError(422, 'No podés reportar tus propios mensajes.');
  }
  if (message.removed_at) throw new ApiError(422, 'Este mensaje ya fue eliminado.');

  await messageReportRepository.create({
    message_id: message.id,
    reporter_id: req.user.id,
    reason: req.body.reason,
    comment: req.body.comment,
  });
  res.status(201).json({ message: 'Gracias. Un moderador va a revisar el mensaje.' });
}

module.exports = { start, list, getMessages, sendMessage, setArchived, remove, getAttachment, reportMessage };
