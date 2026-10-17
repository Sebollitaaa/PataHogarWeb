const { body } = require('express-validator');
const { phoneRule } = require('../utils/phone');

const updateProfileValidator = [
  phoneRule(body('phone').optional({ checkFalsy: true }).trim()),
  body('cityGeorefId').optional({ checkFalsy: true }).notEmpty(),
  body('cityName').if(body('cityGeorefId').exists({ checkFalsy: true })).trim().notEmpty(),
  body('cityProvince').if(body('cityGeorefId').exists({ checkFalsy: true })).trim().notEmpty(),
  body('cityLat').if(body('cityGeorefId').exists({ checkFalsy: true })).isFloat({ min: -90, max: 90 }),
  body('cityLng').if(body('cityGeorefId').exists({ checkFalsy: true })).isFloat({ min: -180, max: 180 }),
  body('verifiedLat').optional({ nullable: true, checkFalsy: true }).isFloat({ min: -90, max: 90 }),
  body('verifiedLng').optional({ nullable: true, checkFalsy: true }).isFloat({ min: -180, max: 180 }),
];

module.exports = { updateProfileValidator };
