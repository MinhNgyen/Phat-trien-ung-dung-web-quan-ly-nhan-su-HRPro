import { get, qs } from './client';

export const reportsApi = {
  dashboard: () => get('/reports/dashboard'),
  employees: () => get('/reports/employees'),
  attendance: (month) => get(`/reports/attendance${qs({ month })}`),
  payroll: (month) => get(`/reports/payroll${qs({ month })}`),
  kpi: (period) => get(`/reports/kpi${qs({ period })}`),
};
