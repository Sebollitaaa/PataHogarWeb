const { Router } = require('express');
const verificationRequestController = require('../controllers/verificationRequestController');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const uploadDocuments = require('../middleware/uploadDocuments');
const { createVerificationRequestValidator } = require('../validators/verificationRequestValidators');

const DOCUMENT_FIELDS = [
  { name: 'statute', maxCount: 10 },
  { name: 'responsibleId', maxCount: 10 },
  { name: 'municipalPermit', maxCount: 10 },
  { name: 'facilityPhotos', maxCount: 10 },
];

const router = Router();

router.post(
  '/',
  requireAuth,
  uploadDocuments.fields(DOCUMENT_FIELDS),
  createVerificationRequestValidator,
  validate,
  verificationRequestController.create
);

module.exports = router;
