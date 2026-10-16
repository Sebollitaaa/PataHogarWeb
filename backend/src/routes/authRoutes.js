const { Router } = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter, codeRequestLimiter, codeCheckLimiter } = require('../middleware/rateLimiters');
const {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  emailOnlyValidator,
  resetPasswordValidator,
  changePasswordValidator,
} = require('../validators/authValidators');

const router = Router();

router.post('/register', registerValidator, validate, codeRequestLimiter, authController.register);
router.post('/login', loginLimiter, loginValidator, validate, authController.login);
router.post('/verify-email', codeCheckLimiter, verifyEmailValidator, validate, authController.verifyEmail);
router.post('/resend-verification', emailOnlyValidator, validate, codeRequestLimiter, authController.resendVerification);
router.post('/forgot-password', emailOnlyValidator, validate, codeRequestLimiter, authController.forgotPassword);
router.post('/reset-password', codeCheckLimiter, resetPasswordValidator, validate, authController.resetPassword);
// Cambio de contraseña con sesión iniciada: viven en /auth porque la cookie de
// sesión solo viaja a esta ruta y hace falta para conservar la sesión actual.
router.post('/password-code', requireAuth, codeRequestLimiter, authController.requestPasswordChangeCode);
router.post('/change-password', requireAuth, codeCheckLimiter, changePasswordValidator, validate, authController.changePassword);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
