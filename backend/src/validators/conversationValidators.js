const { body, param } = require('express-validator');

const startConversationValidator = [
  body('petId').isInt({ min: 1 }).withMessage('Publicación inválida.'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Escribí un mensaje.'),
];

// El texto es opcional cuando el mensaje lleva fotos (la comprobación de "no vacío" la hace chatService).
const sendMessageValidator = [
  body('content').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }).withMessage('El mensaje es demasiado largo.'),
];

const attachmentParamValidator = [
  param('attachmentId').isInt({ min: 1 }),
  param('variant').isIn(['thumb', 'medium']),
];

const reportValidator = [
  param('messageId').isInt({ min: 1 }),
  body('reason').isIn(['inapropiado', 'spam', 'acoso', 'otro']).withMessage('Elegí un motivo.'),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('El comentario es demasiado largo.'),
];

const conversationIdParamValidator = [param('id').isInt({ min: 1 })];

const archiveValidator = [body('archived').isBoolean().withMessage('Valor inválido.')];

module.exports = {
  startConversationValidator,
  sendMessageValidator,
  conversationIdParamValidator,
  archiveValidator,
  attachmentParamValidator,
  reportValidator,
};
