import { api } from './client';

export const usersApi = {
  updateMe: (formData) => api.patch('/users/me', formData, { isForm: true }),
  getPublicProfile: (id) => api.get(`/users/${id}`),
  search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
};
