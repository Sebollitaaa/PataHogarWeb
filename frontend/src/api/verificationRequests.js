import { api } from './client';

export const verificationRequestsApi = {
  submit: (formData) => api.post('/verification-requests', formData, { isForm: true }),
};
