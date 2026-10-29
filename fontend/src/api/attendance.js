import { get, post, put, del, qs } from './client';

export const attendanceApi = {
  list: (filters = {}) => get(`/attendance${qs(filters)}`),
  get: (id) => get(`/attendance/${id}`),
  byEmployee: (employeeId, month) => get(`/attendance/employee/${employeeId}${qs({ month })}`),
  byDate: (date) => get(`/attendance/date/${date}`),
  create: (data) => post('/attendance', data),
  update: (id, data) => put(`/attendance/${id}`, data),
  remove: (id) => del(`/attendance/${id}`),
  checkIn: (employeeId, shiftId) => post('/attendance/check-in', {
    employeeId: Number(employeeId),
    shiftId: shiftId ? Number(shiftId) : undefined,
  }),
  checkOut: (employeeId) => post('/attendance/check-out', { employeeId: Number(employeeId) }),
};