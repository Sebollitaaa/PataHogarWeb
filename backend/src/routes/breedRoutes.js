const { Router } = require('express');
const { query } = require('express-validator');
const validate = require('../middleware/validate');
const breedController = require('../controllers/breedController');

const router = Router();

router.get(
  '/',
  [
    query('q').optional().trim().isLength({ max: 80 }),
    query('speciesId').optional().isInt({ min: 1 }),
    query('includeGeneric').optional().isIn(['true', 'false']),
    query('limit').optional().isInt({ min: 1, max: 60 }),
  ],
  validate,
  breedController.list
);

module.exports = router;
