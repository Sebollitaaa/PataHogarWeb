import { api } from './client';

export const pushApi = {
  publicKey: () => api.get('/push/public-key'),
  subscribe: (subscription) => api.post('/push/subscribe', subscription),
  unsubscribe: (endpoint) => api.post('/push/unsubscribe', { endpoint }),
  test: () => api.post('/push/test'),
};
