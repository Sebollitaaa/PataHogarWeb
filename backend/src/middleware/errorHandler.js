const multer = require('multer');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'Recurso no encontrado'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Errores de la subida de archivos (multer): se traducen a mensajes claros en vez de un 500.
  if (err instanceof multer.MulterError) {
    const byCode = {
      LIMIT_FILE_SIZE: [413, 'Una de las imágenes supera el tamaño máximo de 8 MB.'],
      LIMIT_FILE_COUNT: [422, 'Superaste la cantidad máxima de fotos permitida.'],
      LIMIT_UNEXPECTED_FILE: [422, 'Superaste la cantidad máxima de fotos permitida.'],
    };
    const [status, message] = byCode[err.code] || [400, 'No se pudo procesar el archivo enviado.'];
    return res.status(status).json({ error: { message } });
  }

  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = statusCode === 500 && env.nodeEnv === 'production'
    ? 'Ocurrió un error inesperado en el servidor'
    : err.message;

  if (statusCode === 500) {
    logger.error(err);
  }

  res.status(statusCode).json({
    error: {
      message,
      details: err instanceof ApiError ? err.details : undefined,
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
