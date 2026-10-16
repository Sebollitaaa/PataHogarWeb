const { Router } = require('express');
const conversationController = require('../controllers/conversationController');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  startConversationValidator,
  sendMessageValidator,
  conversationIdParamValidator,
  archiveValidator,
  attachmentParamValidator,
  reportValidator,
} = require('../validators/conversationValidators');

const router = Router();

router.use(requireAuth);

router.get('/', conversationController.list);
router.post('/', startConversationValidator, validate, conversationController.start);

// Fotos del chat (privadas) y reportes: rutas fijas, antes de las que llevan :id de conversación.
router.get('/attachments/:attachmentId/:variant', attachmentParamValidator, validate, conversationController.getAttachment);
router.post('/messages/:messageId/report', reportValidator, validate, conversationController.reportMessage);

router.get('/:id/messages', conversationIdParamValidator, validate, conversationController.getMessages);
// multipart: texto opcional + hasta 5 fotos en el campo "photos" (un JSON sin fotos sigue funcionando igual).
router.post('/:id/messages', conversationIdParamValidator, upload.array('photos', 5), sendMessageValidator, validate, conversationController.sendMessage);

router.patch('/:id/archive', conversationIdParamValidator, archiveValidator, validate, conversationController.setArchived);
router.delete('/:id', conversationIdParamValidator, validate, conversationController.remove);

module.exports = router;
