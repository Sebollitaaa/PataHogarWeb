/**
 * Texto y enlace de cada tipo de notificación, para las notificaciones push
 * (misma redacción que frontend/src/utils/notificationText.js).
 */
function notificationText(n) {
  const payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload || {};
  const petName = payload.petName || 'una mascota';

  switch (n.type) {
    case 'pet_favorited_adopted':
      return `${petName} fue marcada como adoptada.`;
    case 'post_deleted_by_admin':
      return payload.reason === 'marked_outdated'
        ? `Un moderador marcó "${petName}" como información desactualizada.`
        : `Un moderador eliminó tu publicación de ${petName}.`;
    case 'verification_approved':
      return `¡Felicitaciones! Tu solicitud de verificación para "${payload.organizationName || 'tu organización'}" fue aprobada.`;
    case 'verification_rejected':
      return `Tu solicitud de verificación para "${payload.organizationName || 'tu organización'}" fue rechazada${payload.reason ? `: ${payload.reason}` : '.'}`;
    case 'followed_new_pet':
      return `${payload.ownerName || 'Un perfil que seguís'} publicó una mascota nueva: ${petName}.`;
    case 'message_removed_by_admin':
      return 'Un moderador eliminó un mensaje tuyo por incumplir las normas de la comunidad.';
    default:
      return 'Tenés una notificación nueva.';
  }
}

function notificationLink(n) {
  const payload = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload || {};
  if (payload.conversationId) return `/mensajes/${payload.conversationId}`;
  if (payload.petId) return `/mascotas/${payload.petId}`;
  return '/notificaciones';
}

module.exports = { notificationText, notificationLink };
