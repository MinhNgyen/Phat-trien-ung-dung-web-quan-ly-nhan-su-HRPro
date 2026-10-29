import { get, post, put, patch, del, qs } from './client';

export const tasksApi = {
  list: (filters = {}) => get(`/tasks${qs(filters)}`),
  get: (id) => get(`/tasks/${id}`),
  byEmployee: (employeeId, filters = {}) => get(`/tasks/employee/${employeeId}${qs(filters)}`),
  create: (data) => post('/tasks', data),
  update: (id, data) => put(`/tasks/${id}`, data),
  updateStatus: (id, status) => patch(`/tasks/${id}/status`, { status }),
  remove: (id) => del(`/tasks/${id}`),
};
