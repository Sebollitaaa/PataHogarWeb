const ApiError = require('../utils/ApiError');
const verificationRequestRepository = require('../models/verificationRequestRepository');
const documentService = require('../services/documentService');

// Nombre de campo del form -> document_type guardado en DB (coincide con los 4
// documentos que ya muestra la pantalla de revisión de la desktop app).
const DOCUMENT_FIELDS = {
  statute: 'estatuto',
  responsibleId: 'dni_responsable',
  municipalPermit: 'habilitacion_municipal',
  facilityPhotos: 'fotos_instalaciones',
};

async function create(req, res) {
  const existing = await verificationRequestRepository.findPendingByUserId(req.user.id);
  if (existing) {
    throw new ApiError(409, 'Ya tenés una solicitud de verificación pendiente de revisión.');
  }

  const files = req.files || {};
  for (const field of Object.keys(DOCUMENT_FIELDS)) {
    if (!files[field] || files[field].length === 0) {
      throw new ApiError(400, 'Tenés que adjuntar los 4 documentos solicitados.');
    }
  }

  const {
    organizationName, organizationType, responsibleName, email, phone,
    address, city, province, yearsInOperation, animalsHoused, website, description,
  } = req.body;

  const requestId = await verificationRequestRepository.create({
    user_id: req.user.id,
    organization_name: organizationName,
    organization_type: organizationType,
    responsible_name: responsibleName,
    email,
    phone,
    address,
    city,
    province,
    years_in_operation: yearsInOperation,
    animals_housed: animalsHoused,
    website: website || null,
    description,
    status: 'pendiente',
  });

  for (const [field, documentType] of Object.entries(DOCUMENT_FIELDS)) {
    for (const file of files[field]) {
      const filePath = await documentService.saveVerificationDocument(file.buffer, requestId, documentType, file.originalname);
      await verificationRequestRepository.addDocument({
        request_id: requestId,
        document_type: documentType,
        original_filename: file.originalname,
        file_path: filePath,
      });
    }
  }

  res.status(201).json({ message: 'Solicitud de verificación enviada. Te vamos a avisar cuando sea revisada.' });
}

module.exports = { create };
