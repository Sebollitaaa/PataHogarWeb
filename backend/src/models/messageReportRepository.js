const db = require('../db/knex');

function create({ message_id, reporter_id, reason, comment }) {
  return db('message_reports')
    .insert({ message_id, reporter_id, reason, comment: comment || null })
    .onConflict(['message_id', 'reporter_id'])
    .ignore();
}

function hasReportForMessage(messageId) {
  return db('message_reports').where({ message_id: messageId }).first().then(Boolean);
}

function findById(id) {
  return db('message_reports').where({ id }).first();
}

/** Reportes con los datos que necesita el moderador para decidir. */
function listForAdmin({ status = 'pendiente', limit = 50 } = {}) {
  return db('message_reports as r')
    .join('messages as m', 'm.id', 'r.message_id')
    .join('users as reporter', 'reporter.id', 'r.reporter_id')
    .leftJoin('users as sender', 'sender.id', 'm.sender_id')
    .where('r.status', status)
    .orderBy('r.created_at', 'desc')
    .limit(limit)
    .select(
      'r.id', 'r.reason', 'r.comment', 'r.status', 'r.created_at', 'r.resolved_at',
      'm.id as message_id', 'm.conversation_id', 'm.content', 'm.created_at as message_created_at', 'm.removed_at',
      'reporter.id as reporter_id', 'reporter.first_name as reporter_first_name', 'reporter.last_name as reporter_last_name',
      'sender.id as sender_id', 'sender.first_name as sender_first_name', 'sender.last_name as sender_last_name',
      'sender.status as sender_status'
    );
}

/** Cierra todos los reportes pendientes de un mensaje. */
function resolveForMessage(messageId, { status, adminId }) {
  return db('message_reports')
    .where({ message_id: messageId, status: 'pendiente' })
    .update({ status, resolved_by: adminId, resolved_at: db.fn.now() });
}

module.exports = { create, hasReportForMessage, findById, listForAdmin, resolveForMessage };
