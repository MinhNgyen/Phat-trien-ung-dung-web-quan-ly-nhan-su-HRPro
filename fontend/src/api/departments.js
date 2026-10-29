import { get, post, put, del } from './client';

export const departmentsApi = {
  list: () => get('/departments'),
  get: (id) => get(`/departments/${id}`),
  employees: (id) => get(`/departments/${id}/employees`),
  create: (data) => post('/departments', data),
  update: (id, data) => put(`/departments/${id}`, data),
  remove: (id) => del(`/departments/${id}`),
};
