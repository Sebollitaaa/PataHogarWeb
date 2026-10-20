/* Service worker de PataHogar: recibe las notificaciones push aunque la página esté cerrada.
   No guarda archivos en caché ni intercepta pedidos: solo maneja los avisos. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'PataHogar';
  const options = {
    body: data.body || '',
    icon: '/logo-192.png',
    badge: '/favicon-32.png',
    tag: data.tag || undefined,
    // Un mensaje nuevo de la misma conversación reemplaza al anterior pero vuelve a avisar.
    renotify: Boolean(data.tag),
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin);

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((w) => new URL(w.url).origin === self.location.origin);

    if (open) {
      await open.focus();
      // La página (React) recibe el mensaje y navega sin recargar.
      open.postMessage({ type: 'navigate', url: target.pathname + target.search });
      return;
    }
    await self.clients.openWindow(target.href);
  })());
});
