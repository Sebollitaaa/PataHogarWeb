import { api } from './client';

export const followsApi = {
  list: () => api.get('/follows'),
  ids: () => api.get('/follows/ids'),
  follow: (userId) => api.post(`/follows/${userId}`),
  unfollow: (userId) => api.delete(`/follows/${userId}`),
};
