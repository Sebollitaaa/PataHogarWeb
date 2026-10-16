const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const userRepository = require('../models/userRepository');
const cityRepository = require('../models/cityRepository');
const refreshTokenRepository = require('../models/refreshTokenRepository');
const tokenService = require('../services/tokenService');
const locationService = require('../services/locationService');
const emailCodeService = require('../services/emailCodeService');
const env = require('../config/env');

const { PURPOSES } = emailCodeService;

const BCRYPT_ROUNDS = 12;
const REFRESH_COOKIE_NAME = 'refresh_token';

function refreshCookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
    path: '/api/auth',
  };
}

// Los clientes móviles no manejan cookies httpOnly de forma fiable: si mandan
// `X-Client: mobile`, el refresh token viaja en el cuerpo (login/refresh/logout).
function isMobileClient(req) {
  return req.headers['x-client'] === 'mobile';
}

function toPublicUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    profilePhotoUrl: user.profile_photo_url,
    cityId: user.city_id,
    cityName: user.city_name,
    cityProvince: user.city_province,
    role: user.role,
    isVerifiedOrganization: Boolean(user.is_verified_organization),
    createdAt: user.created_at,
  };
}

function readRefreshToken(req) {
  if (isMobileClient(req)) return typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null;
  return req.cookies[REFRESH_COOKIE_NAME];
}

async function register(req, res) {
  const {
    firstName, lastName, email, password, phone, verifiedLat, verifiedLng,
    cityGeorefId, cityName, cityProvince, cityLat, cityLng,
  } = req.body;

  const existing = await userRepository.findByEmail(email);
  if (existing && existing.email_verified_at) {
    throw new ApiError(409, 'Ya existe una cuenta registrada con ese email.');
  }

  const city = await cityRepository.findOrCreateByGeoref({
    georefId: cityGeorefId,
    name: cityName,
    province: cityProvince,
    latitude: cityLat,
    longitude: cityLng,
  });

  const location = locationService.resolveUserLocation(city, verifiedLat, verifiedLng);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const profile = {
    first_name: firstName,
    last_name: lastName,
    password_hash: passwordHash,
    phone,
    city_id: city.id,
    verified_lat: location.verifiedLat,
    verified_lng: location.verifiedLng,
    location_source: location.locationSource,
  };

  let user;
  if (existing) {
    // Cuenta creada pero nunca verificada: se reutiliza con los datos nuevos. Solo
    // quien controle el correo podrá activarla con el código, así que es seguro.
    await userRepository.update(existing.id, profile);
    user = await userRepository.findById(existing.id);
  } else {
    user = await userRepository.create({ ...profile, email });
  }

  // Si ya se envió un código hace instantes (reintento inmediato), no se vuelve a enviar.
  let emailSent = true;
  if ((await emailCodeService.cooldownRemaining(user.id, PURPOSES.VERIFY_EMAIL)) === 0) {
    emailSent = await emailCodeService.issueAndSend(user, PURPOSES.VERIFY_EMAIL);
  }

  res.status(201).json({
    message: 'Cuenta creada. Te enviamos un código a tu correo para verificarla.',
    email: user.email,
    requiresVerification: true,
    emailSent,
  });
}

async function verifyEmail(req, res) {
  const { email, code } = req.body;
  const user = await userRepository.findByEmail(email);

  if (user && user.email_verified_at) {
    throw new ApiError(400, 'Esta cuenta ya está verificada. Podés iniciar sesión.');
  }

  await emailCodeService.consume(user, PURPOSES.VERIFY_EMAIL, code);
  await userRepository.update(user.id, { email_verified_at: new Date() });

  res.json({ message: 'Correo verificado. Ya podés iniciar sesión.' });
}

// Respuesta siempre genérica: no se revela si el correo existe o si ya está verificado.
async function resendVerification(req, res) {
  const user = await userRepository.findByEmail(req.body.email);

  if (user && !user.email_verified_at && user.status !== 'banned') {
    if ((await emailCodeService.cooldownRemaining(user.id, PURPOSES.VERIFY_EMAIL)) === 0) {
      await emailCodeService.issueAndSend(user, PURPOSES.VERIFY_EMAIL);
    }
  }

  res.json({ message: 'Si el correo corresponde a una cuenta pendiente de verificación, te enviamos un código nuevo.' });
}

async function forgotPassword(req, res) {
  const user = await userRepository.findByEmail(req.body.email);

  if (user && user.status !== 'banned') {
    if ((await emailCodeService.cooldownRemaining(user.id, PURPOSES.RESET_PASSWORD)) === 0) {
      await emailCodeService.issueAndSend(user, PURPOSES.RESET_PASSWORD);
    }
  }

  res.json({ message: 'Si el correo corresponde a una cuenta, te enviamos un código para restablecer la contraseña.' });
}

async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body;
  const user = await userRepository.findByEmail(email);

  await emailCodeService.consume(user, PURPOSES.RESET_PASSWORD, code);

  const changes = { password_hash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) };
  // Haber recibido el código demuestra que la persona controla ese correo.
  if (!user.email_verified_at) changes.email_verified_at = new Date();
  await userRepository.update(user.id, changes);

  // Por seguridad se cierran todas las sesiones abiertas de la cuenta.
  await refreshTokenRepository.revokeAllForUser(user.id);

  res.json({ message: 'Contraseña actualizada. Ya podés iniciar sesión con la nueva.' });
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@');
  return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

/**
 * Cambio de contraseña con la sesión iniciada, paso 1: envía un código al correo
 * de la cuenta. Es el mismo mecanismo que "Olvidé mi contraseña", pero sin pedir el correo.
 */
async function requestPasswordChangeCode(req, res) {
  const user = await userRepository.findById(req.user.id);

  const wait = await emailCodeService.cooldownRemaining(user.id, PURPOSES.RESET_PASSWORD);
  if (wait > 0) throw new ApiError(429, `Esperá ${wait} segundos antes de pedir otro código.`);

  const emailSent = await emailCodeService.issueAndSend(user, PURPOSES.RESET_PASSWORD);
  res.json({ message: 'Te enviamos un código de 6 dígitos a tu correo.', email: maskEmail(user.email), emailSent });
}

/**
 * Paso 2: con el código y la nueva contraseña se cambia. La sesión actual
 * sigue abierta; las de los demás dispositivos se cierran.
 */
async function changePassword(req, res) {
  const { code, newPassword } = req.body;
  const user = await userRepository.findById(req.user.id);

  await emailCodeService.consume(user, PURPOSES.RESET_PASSWORD, code);
  await userRepository.update(user.id, { password_hash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) });

  const token = readRefreshToken(req);
  const current = token ? await refreshTokenRepository.findActiveByHash(tokenService.hashRefreshToken(token)) : null;
  if (current && current.user_id === user.id) {
    await refreshTokenRepository.revokeAllForUserExcept(user.id, current.id);
  } else {
    await refreshTokenRepository.revokeAllForUser(user.id);
  }

  res.json({ message: 'Contraseña actualizada. Cerramos tu sesión en los otros dispositivos.' });
}

async function issueSession(res, user, rememberMe, req) {
  const accessToken = tokenService.signAccessToken(user);
  const { token, tokenHash, expiresAt, days } = tokenService.generateRefreshToken(rememberMe);

  await refreshTokenRepository.create({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    user_agent: req.headers['user-agent'] || null,
    ip_address: req.ip,
  });

  if (isMobileClient(req)) return { accessToken, refreshToken: token };

  res.cookie(REFRESH_COOKIE_NAME, token, refreshCookieOptions(days * 24 * 60 * 60 * 1000));
  return { accessToken };
}

async function login(req, res) {
  const { email, password, rememberMe } = req.body;

  const user = await userRepository.findByEmail(email);
  if (!user) throw new ApiError(401, 'Email o contraseña incorrectos.');

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) throw new ApiError(401, 'Email o contraseña incorrectos.');

  if (user.status === 'banned') throw new ApiError(403, 'Tu cuenta fue suspendida.');

  if (!user.email_verified_at) {
    const message = 'Tenés que verificar tu correo antes de iniciar sesión.';
    throw new ApiError(403, message, [{ field: 'email', code: 'email_not_verified', message, email: user.email }]);
  }

  const session = await issueSession(res, user, Boolean(rememberMe), req);
  await userRepository.update(user.id, { last_login_at: new Date() });

  const publicUser = await userRepository.findPublicById(user.id);
  res.json({ ...session, user: toPublicUser(publicUser) });
}

async function refresh(req, res) {
  const token = readRefreshToken(req);
  if (!token) throw new ApiError(401, 'No hay sesión activa.');

  const tokenHash = tokenService.hashRefreshToken(token);
  const record = await refreshTokenRepository.findActiveByHash(tokenHash);
  if (!record) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    throw new ApiError(401, 'Sesión expirada, iniciá sesión de nuevo.');
  }

  const user = await userRepository.findById(record.user_id);
  if (!user || user.status === 'banned') {
    throw new ApiError(401, 'Sesión inválida.');
  }

  // Rotación: se revoca el token usado y se emite uno nuevo.
  await refreshTokenRepository.revoke(record.id);
  const rememberMe = record.expires_at - record.created_at > 2 * 24 * 60 * 60 * 1000;
  const session = await issueSession(res, user, rememberMe, req);

  const publicUser = await userRepository.findPublicById(user.id);
  res.json({ ...session, user: toPublicUser(publicUser) });
}

async function logout(req, res) {
  const token = readRefreshToken(req);
  if (token) {
    const tokenHash = tokenService.hashRefreshToken(token);
    const record = await refreshTokenRepository.findActiveByHash(tokenHash);
    if (record) await refreshTokenRepository.revoke(record.id);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
  res.json({ message: 'Sesión cerrada.' });
}

async function me(req, res) {
  const user = await userRepository.findPublicById(req.user.id);
  if (!user) throw new ApiError(404, 'Usuario no encontrado.');
  res.json({ user: toPublicUser(user) });
}

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  requestPasswordChangeCode,
  changePassword,
  login,
  refresh,
  logout,
  me,
  toPublicUser,
};
