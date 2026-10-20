const db = require('../db/knex');

async function create({ conversation_id, sender_id, content }) {
  const [id] = await db('messages').insert({ conversation_id, sender_id, content: content || null });
  return id;
}

function findById(id) {
  return db('messages').where({ id }).first();
}

function findByConversation(conversationId, { beforeId, limit = 30 } = {}) {
  let query = db('messages').where({ conversation_id: conversationId });
  if (beforeId) query = query.where('id', '<', beforeId);
  return query.orderBy('id', 'desc').limit(limit);
}

function markAllRead(conversationId, userId) {
  return db('messages')
    .where({ conversation_id: conversationId })
    .whereNot('sender_id', userId)
    .whereNull('read_at')
    .update({ read_at: db.fn.now() });
}

function unreadCountsForConversations(conversationIds, userId) {
  if (conversationIds.length === 0) return Promise.resolve([]);
  return db('messages')
    .whereIn('conversation_id', conversationIds)
    .whereNot('sender_id', userId)
    .whereNull('read_at')
    .select('conversation_id')
    .count({ count: '*' })
    .groupBy('conversation_id');
}

function lastMessageForConversations(conversationIds) {
  if (conversationIds.length === 0) return Promise.resolve([]);
  return db('messages')
    .whereIn('conversation_id', conversationIds)
    .whereIn('id', function () {
      this.select(db.raw('MAX(id)')).from('messages').whereIn('conversation_id', conversationIds).groupBy('conversation_id');
    });
}

/** Mensajes recibidos y sin leer del usuario, en todas sus conversaciones (para el contador del chat). */
async function countUnreadForUser(userId) {
  const row = await db('messages as m')
    .join('conversations as c', 'c.id', 'm.conversation_id')
    .where((b) => {
      b.where((a) => a.where('c.user_a_id', userId).andWhere('c.deleted_by_a', false))
        .orWhere((a) => a.where('c.user_b_id', userId).andWhere('c.deleted_by_b', false));
    })
    .whereNull('m.read_at')
    .whereNull('m.removed_at')
    .whereNot('m.sender_id', userId)
    .count({ count: '*' })
    .first();
  return Number(row.count);
}

/* ---------- adjuntos ---------- */

function addAttachments(messageId, items) {
  if (items.length === 0) return Promise.resolve();
  return db('message_attachments').insert(items.map((i) => ({
    message_id: messageId,
    thumb_file: i.thumbFile,
    medium_file: i.mediumFile,
    width: i.width,
    height: i.height,
  })));
}

function findAttachmentsForMessages(messageIds) {
  if (messageIds.length === 0) return Promise.resolve([]);
  return db('message_attachments').whereIn('message_id', messageIds).orderBy('id');
}

function findAttachmentById(id) {
  return db('message_attachments')
    .join('messages', 'messages.id', 'message_attachments.message_id')
    .where('message_attachments.id', id)
    .select('message_attachments.*', 'messages.conversation_id', 'messages.removed_at')
    .first();
}

function deleteAttachmentsForMessage(messageId) {
  return db('message_attachments').where({ message_id: messageId }).del();
}

function markRemoved(messageId, reason) {
  return db('messages').where({ id: messageId }).update({ removed_at: db.fn.now(), removed_reason: reason || null });
}

module.exports = {
  create,
  findById,
  findByConversation,
  markAllRead,
  unreadCountsForConversations,
  countUnreadForUser,
  lastMessageForConversations,
  addAttachments,
  findAttachmentsForMessages,
  findAttachmentById,
  deleteAttachmentsForMessage,
  markRemoved,
};
