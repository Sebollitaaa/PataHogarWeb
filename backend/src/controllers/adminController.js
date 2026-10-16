const ApiError = require('../utils/ApiError');
const db = require('../db/knex');
const userRepository = require('../models/userRepository');
const refreshTokenRepository = require('../models/refreshTokenRepository');
const adminActionRepository = require('../models/adminActionRepository');
const petRepository = require('../models/petRepository');
const imageService = require('../services/imageService');
const chatImageService = require('../services/chatImageService');
const messageRepository = require('../models/messageRepository');
const messageReportRepository = require('../models/messageReportRepository');
const notificationService = require('../services/notificationService');

async function listUsers(req, res) {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 30;

  let query = db('users').select(userRepository.PUBLIC_COLUMNS);
  if (req.query.q) {
    const q = `%${req.query.q}%`;
    query = query.where((b) => {
      b.where('email', 'like', q).orWhere('first_name', 'like', q).orWhere('last_name', 'like', q);
    });
  }

  const users = await query.clone().orderBy('created_at', 'desc').limit(pageSize).offset((page - 1) * pageSize);
  const totalRow = await db.count('* as count').from(query.clone().clearOrder().as('sub')).first();

  res.json({ users, pagination: { page, pageSize, total: Number(totalRow.count) } });
}

async function banUser(req, res) {
  const targetId = Number(req.params.id);
  if (targetId === Number(req.user.id)) throw new ApiError(400, 'No podés banearte a vos mismo.');

  const user = await userRepository.findById(targetId);
  if (!user) throw new ApiError(404, 'Usuario no encontrado.');

  await userRepository.update(targetId, { status: 'banned' });
  await refreshTokenRepository.revokeAllForUser(targetId);
  await adminActionRepository.create({
    admin_id: req.user.id,
    action_type: 'ban_user',
    target_type: 'user',
    target_id: targetId,
    reason: req.body.reason || null,
  });

  res.json({ message: 'Usuario suspendido.' });
}

async function unbanUser(req, res) {
  const targetId = Number(req.params.id);
  const user = await userRepository.findById(targetId);
  if (!user) throw new ApiError(404, 'Usuario no encontrado.');

  await userRepository.update(targetId, { status: 'active' });
  res.json({ message: 'Usuario reactivado.' });
}

async function deleteUser(req, res) {
  const targetId = Number(req.params.id);
  if (targetId === Number(req.user.id)) throw new ApiError(400, 'No podés eliminar tu propia cuenta desde acá.');

  const user = await userRepository.findById(targetId);
  if (!user) throw new ApiError(404, 'Usuario no encontrado.');

  const ownedPets = await db('pets').where({ owner_id: targetId }).select('id');
  // Las conversaciones del usuario caen en cascada: hay que borrar también sus fotos del chat.
  const convoIds = await db('conversations').where({ user_a_id: targetId }).orWhere({ user_b_id: targetId }).pluck('id');

  await adminActionRepository.create({
    admin_id: req.user.id,
    action_type: 'delete_user',
    target_type: 'user',
    target_id: targetId,
    reason: req.body.reason || null,
  });

  // El admin_action queda registrado antes de borrar; el usuario se elimina en cascada
  // (sus publicaciones, favoritos, conversaciones y refresh tokens caen con él).
  await db('users').where({ id: targetId }).del();

  for (const pet of ownedPets) {
    await imageService.deleteEntityImages('pets', pet.id);
  }
  for (const convoId of convoIds) {
    await chatImageService.deleteConversation(convoId);
  }

  res.json({ message: 'Usuario eliminado.' });
}

async function listActions(req, res) {
  const page = req.query.page ? parseInt(req.query.page, 10) : 1;
  const actions = await adminActionRepository.findAll({ page, pageSize: 30 });
  res.json({ actions });
}

async function listReports(req, res) {
  const status = ['pendiente', 'resuelto', 'descartado'].includes(req.query.status) ? req.query.status : 'pendiente';
  const rows = await messageReportRepository.listForAdmin({ status });

  const attachments = await messageRepository.findAttachmentsForMessages(rows.map((r) => r.message_id));
  const byMessage = {};
  for (const att of attachments) {
    if (!byMessage[att.message_id]) byMessage[att.message_id] = [];
    byMessage[att.message_id].push({ id: att.id });
  }

  res.json({
    reports: rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      comment: r.comment,
      status: r.status,
      createdAt: r.created_at,
      resolvedAt: r.resolved_at,
      reporter: { id: r.reporter_id, name: `${r.reporter_first_name} ${r.reporter_last_name}` },
      message: {
        id: r.message_id,
        conversationId: r.conversation_id,
        content: r.removed_at ? null : r.content,
        attachments: r.removed_at ? [] : byMessage[r.message_id] || [],
        removed: Boolean(r.removed_at),
        createdAt: r.message_created_at,
        sender: r.sender_id
          ? { id: r.sender_id, name: `${r.sender_first_name} ${r.sender_last_name}`, status: r.sender_status }
          : null,
      },
    })),
  });
}

/**
 * Resolución de un reporte: `remove` retira el mensaje (queda el hueco en el
 * historial, sin texto ni fotos) y avisa al autor; `dismiss` lo descarta.
 */
async function resolveReport(req, res) {
  const report = await messageReportRepository.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Reporte no encontrado.');

  const message = await messageRepository.findById(report.message_id);
  const { action, note } = req.body;

  if (action === 'remove' && message && !message.removed_at) {
    const attachments = await messageRepository.findAttachmentsForMessages([message.id]);
    await chatImageService.deleteFiles(
      message.conversation_id,
      attachments.flatMap((a) => [a.thumb_file, a.medium_file])
    );
    await messageRepository.deleteAttachmentsForMessage(message.id);
    await messageRepository.markRemoved(message.id, note || 'Incumple las normas de la comunidad.');

    await adminActionRepository.create({
      admin_id: req.user.id,
      action_type: 'remove_message',
      target_type: 'message',
      target_id: message.id,
      reason: note || null,
    });

    if (message.sender_id) {
      await notificationService.create(req.app.get('io'), {
        user_id: message.sender_id,
        type: 'message_removed_by_admin',
        payload: { conversationId: message.conversation_id },
      });
    }
  }

  await messageReportRepository.resolveForMessage(report.message_id, {
    status: action === 'remove' ? 'resuelto' : 'descartado',
    adminId: req.user.id,
  });

  res.json({ message: action === 'remove' ? 'Mensaje eliminado.' : 'Reporte descartado.' });
}

module.exports = { listUsers, banUser, unbanUser, deleteUser, listActions, listReports, resolveReport };
