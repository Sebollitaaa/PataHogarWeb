const { body } = require('express-validator');

const createVerificationRequestValidator = [
  body('organizationName').trim().isLength({ min: 2, max: 150 }).withMessage('El nombre de la organización es obligatorio.'),
  body('organizationType').isIn(['refugio', 'veterinaria', 'asociacion']).withMessage('Elegí el tipo de organización.'),
  body('responsibleName').trim().isLength({ min: 2, max: 150 }).withMessage('El nombre del responsable es obligatorio.'),
  body('email').trim().isEmail().withMessage('El email no es válido.').normalizeEmail(),
  body('phone').trim().matches(/^[0-9+\s-]{6,30}$/).withMessage('El teléfono no es válido.'),
  body('address').trim().isLength({ min: 5, max: 255 }).withMessage('La dirección es obligatoria.'),
  body('city').trim().isLength({ min: 2, max: 120 }).withMessage('La ciudad es obligatoria.'),
  body('province').trim().isLength({ min: 2, max: 120 }).withMessage('La provincia es obligatoria.'),
  body('yearsInOperation').isInt({ min: 0, max: 200 }).withMessage('Antigüedad inválida.'),
  body('animalsHoused').isInt({ min: 0, max: 100000 }).withMessage('Cantidad de animales inválida.'),
  body('website').optional({ checkFalsy: true }).trim().isLength({ max: 255 }),
  body('description').trim().isLength({ min: 20, max: 3000 }).withMessage('Contanos un poco más sobre la organización (mínimo 20 caracteres).'),
];

module.exports = { createVerificationRequestValidator };
