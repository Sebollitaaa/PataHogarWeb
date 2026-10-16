const { Router } = require('express');
const { param } = require('express-validator');
const followController = require('../controllers/followController');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = Router();
const userIdParam = [param('userId').isInt({ min: 1 })];

router.get('/', requireAuth, followController.listMine);
router.get('/ids', requireAuth, followController.listIds);
router.post('/:userId', requireAuth, userIdParam, validate, followController.follow);
router.delete('/:userId', requireAuth, userIdParam, validate, followController.unfollow);

module.exports = router;
