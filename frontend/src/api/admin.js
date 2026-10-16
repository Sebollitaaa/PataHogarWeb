import { api } from './client';

export const adminApi = {
  listUsers: (q = '') => api.get(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  banUser: (id, reason) => api.patch(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id) => api.patch(`/admin/users/${id}/unban`),
  deleteUser: (id, reason) => api.delete(`/admin/users/${id}`, { reason }),
  actions: () => api.get('/admin/actions'),
  reports: (status = 'pendiente') => api.get(`/admin/reports?status=${status}`),
  resolveReport: (id, action, note) => api.post(`/admin/reports/${id}/resolve`, { action, note }),
};
