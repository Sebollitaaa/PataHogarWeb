const multer = require('multer');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const uploadDocuments = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 40 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Solo se permiten archivos PDF o imágenes (JPG, PNG, WEBP).'));
    }
    cb(null, true);
  },
});

module.exports = uploadDocuments;
