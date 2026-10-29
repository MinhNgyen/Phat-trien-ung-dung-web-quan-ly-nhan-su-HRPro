import { get, post, qs } from './client';

export const kpiApi = {
  list: (filters = {}) => get(`/kpi${qs(filters)}`),
  get: (id) => get(`/kpi/${id}`),
  byEmployee: (employeeId) => get(`/kpi/employee/${employeeId}`),
  recalculate: (data) => post('/kpi/recalculate', data),
};
