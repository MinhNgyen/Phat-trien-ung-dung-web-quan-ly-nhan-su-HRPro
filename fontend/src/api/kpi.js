import { get, post, put, del, qs } from './client';

export const kpiApi = {
  list: (filters = {}) => get(`/kpi${qs(filters)}`),
  get: (id) => get(`/kpi/${id}`),
  byEmployee: (employeeId) => get(`/kpi/employee/${employeeId}`),
  create: (data) => post('/kpi', data),
  update: (id, data) => put(`/kpi/${id}`, data),
  remove: (id) => del(`/kpi/${id}`),
};
