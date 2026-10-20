const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const pushController = require('../controllers/pushController');

const router = Router();

const endpointRule = body('endpoint').isURL({ protocols: ['https'], require_protocol: true, require_tld: false }).isLength({ max: 2000 })
  .withMessage('La suscripción no es válida.');

router.get('/public-key', pushController.publicKey);

router.post(
  '/subscribe',
  requireAuth,
  [
    endpointRule,
    body('keys.p256dh').isString().isLength({ min: 20, max: 255 }),
    body('keys.auth').isString().isLength({ min: 8, max: 255 }),
  ],
  validate,
  pushController.subscribe
);
router.post('/unsubscribe', requireAuth, [endpointRule], validate, pushController.unsubscribe);
router.post('/test', requireAuth, pushController.test);

module.exports = router;
