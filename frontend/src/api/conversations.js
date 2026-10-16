import { api } from './client';

export const conversationsApi = {
  list: () => api.get('/conversations'),
  start: (petId, content) => api.post('/conversations', { petId, content }),
  messages: (conversationId, beforeId) => api.get(`/conversations/${conversationId}/messages${beforeId ? `?beforeId=${beforeId}` : ''}`),
  send: (conversationId, content, files = []) => {
    if (files.length === 0) return api.post(`/conversations/${conversationId}/messages`, { content });
    const fd = new FormData();
    if (content) fd.append('content', content);
    files.forEach((file) => fd.append('photos', file));
    return api.post(`/conversations/${conversationId}/messages`, fd, { isForm: true });
  },
  attachment: (attachmentId, variant) => api.blob(`/conversations/attachments/${attachmentId}/${variant}`),
  report: (messageId, reason, comment) => api.post(`/conversations/messages/${messageId}/report`, { reason, comment }),
  archive: (conversationId, archived) => api.patch(`/conversations/${conversationId}/archive`, { archived }),
  remove: (conversationId) => api.delete(`/conversations/${conversationId}`),
};
