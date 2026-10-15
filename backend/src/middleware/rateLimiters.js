const rateLimit = require('express-rate-limit');

// Límite general para toda la API, evita abuso básico.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Demasiadas solicitudes, probá de nuevo más tarde.' } },
});

// Límite estricto para login: evita fuerza bruta de contraseñas.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: { message: 'Demasiados intentos de inicio de sesión. Esperá unos minutos.' } },
});

// Pedidos que disparan un correo (registro, reenvío, recuperación): evita usar el
// sistema para spamear casillas ajenas o agotar el cupo del servicio de envío.
const codeRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Hiciste varios pedidos seguidos. Esperá unos minutos antes de volver a intentar.' } },
});

// Intentos de ingresar un código: además del límite por código, un tope por IP.
const codeCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Demasiados intentos con códigos. Esperá unos minutos.' } },
});

module.exports = { generalLimiter, loginLimiter, codeRequestLimiter, codeCheckLimiter };
