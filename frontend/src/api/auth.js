import { api } from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  verifyEmail: (payload) => api.post('/auth/verify-email', payload),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  requestPasswordCode: () => api.post('/auth/password-code'),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};
