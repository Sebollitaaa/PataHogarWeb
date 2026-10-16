import { api } from './client';

export const catalogApi = {
  cities: () => api.get('/cities'),
  searchCities: (q) => api.get(`/cities/search?q=${encodeURIComponent(q)}`),
  species: () => api.get('/species'),
  breeds: ({ q, speciesId, includeGeneric, limit } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (speciesId) params.set('speciesId', speciesId);
    if (includeGeneric === false) params.set('includeGeneric', 'false');
    if (limit) params.set('limit', limit);
    const qs = params.toString();
    return api.get(`/breeds${qs ? `?${qs}` : ''}`);
  },
};
