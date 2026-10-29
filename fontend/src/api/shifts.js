import { get, post, put, del } from './client';

export const shiftsApi = {
  list: () => get('/shifts'),
  get: (id) => get(`/shifts/${id}`),
  create: (data) => post('/shifts', data),
  update: (id, data) => put(`/shifts/${id}`, data),
  remove: (id) => del(`/shifts/${id}`),
};
