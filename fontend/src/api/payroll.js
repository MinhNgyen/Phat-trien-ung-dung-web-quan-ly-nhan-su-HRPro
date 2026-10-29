import { get, post, put, del, qs } from './client';

export const payrollApi = {
  list: (filters = {}) => get(`/payroll${qs(filters)}`),
  byMonth: (month) => get(`/payroll/${month}`),
  byEmployee: (employeeId) => get(`/payroll/employee/${employeeId}`),
  calculate: (month, options = {}) => post('/payroll/calculate', { month, ...options }),
  update: (id, data) => put(`/payroll/${id}`, data),
  remove: (id) => del(`/payroll/${id}`),
  lock: (month) => post('/payroll/lock', { month }),
  unlock: (month) => post('/payroll/unlock', { month }),
  locks: () => get('/payroll/locks'),
};
