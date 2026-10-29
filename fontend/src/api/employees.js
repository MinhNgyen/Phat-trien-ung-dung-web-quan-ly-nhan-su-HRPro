import { get, post, put, del, qs } from './client';

export const employeesApi = {
  list: (filters = {}) => get(`/employees${qs(filters)}`),
  get: (id) => get(`/employees/${id}`),
  create: (data) => post('/employees', data),
  update: (id, data) => put(`/employees/${id}`, data),
  remove: (id) => del(`/employees/${id}`),
  getShifts: (id) => get(`/employees/${id}/shifts`),
  assignShift: (id, shiftId, isPrimary = false) => post(`/employees/${id}/shifts`, { shiftId, isPrimary }),
  unassignShift: (id, shiftId) => del(`/employees/${id}/shifts/${shiftId}`),
};
