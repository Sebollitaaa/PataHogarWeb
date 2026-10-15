const env = require('../config/env');
const logger = require('../utils/logger');

const RESEND_URL = 'https://api.resend.com/emails';

/**
 * Envía un correo mediante la API de Resend (HTTP, sin dependencias extra).
 * Sin RESEND_API_KEY y fuera de producción, simula el envío imprimiendo el
 * contenido en la consola, lo que permite desarrollar sin configurar el servicio.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!env.email.resendApiKey) {
    if (env.nodeEnv === 'production') {
      throw new Error('El envío de correos no está configurado (falta RESEND_API_KEY).');
    }
    logger.warn(`[CORREO SIMULADO] Para: ${to} | Asunto: ${subject}\n${text}`);
    return { simulated: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.email.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.email.from, to: [to], subject, html, text }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Resend respondió ${res.status}: ${detail}`);
    }
    return { simulated: false };
  } finally {
    clearTimeout(timeout);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function layout({ title, intro, code, outro }) {
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#f6f5f1;font-family:Segoe UI,Arial,sans-serif;color:#211f1a;">
  <div style="max-width:480px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border-radius:14px;padding:28px;border:1px solid #e4e1d8;">
      <p style="margin:0 0 4px;font-size:20px;font-weight:800;color:#175646;">PataHogar</p>
      <h1 style="margin:16px 0 8px;font-size:18px;">${escapeHtml(title)}</h1>
      <p style="margin:0 0 18px;line-height:1.5;">${intro}</p>
      <div style="text-align:center;margin:18px 0;">
        <span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:700;background:#e3efec;color:#175646;padding:12px 22px;border-radius:10px;">${escapeHtml(code)}</span>
      </div>
      <p style="margin:0;font-size:13px;color:#6b6558;line-height:1.5;">${outro}</p>
    </div>
  </div>
</body></html>`;
}

async function sendVerificationCodeEmail(to, firstName, code) {
  const minutes = env.email.codeExpiresMinutes;
  const name = escapeHtml(firstName);
  return sendEmail({
    to,
    subject: 'Tu código de verificación de PataHogar',
    text: `Hola ${firstName}! Tu código de verificación es ${code}. Vence en ${minutes} minutos. Si no creaste una cuenta, ignorá este mensaje.`,
    html: layout({
      title: 'Confirmá tu correo',
      intro: `Hola ${name}, ingresá este código para verificar tu cuenta:`,
      code,
      outro: `El código vence en ${minutes} minutos. Si no creaste una cuenta en PataHogar, podés ignorar este mensaje.`,
    }),
  });
}

async function sendPasswordResetEmail(to, firstName, code) {
  const minutes = env.email.codeExpiresMinutes;
  const name = escapeHtml(firstName);
  return sendEmail({
    to,
    subject: 'Código para restablecer tu contraseña de PataHogar',
    text: `Hola ${firstName}! Tu código para restablecer la contraseña es ${code}. Vence en ${minutes} minutos. Si no lo pediste, ignorá este mensaje.`,
    html: layout({
      title: 'Restablecer contraseña',
      intro: `Hola ${name}, usá este código para elegir una nueva contraseña:`,
      code,
      outro: `El código vence en ${minutes} minutos. Si no lo pediste vos, ignorá este mensaje: tu contraseña no cambia.`,
    }),
  });
}

module.exports = { sendEmail, sendVerificationCodeEmail, sendPasswordResetEmail };
