import { get, put } from './client';

export const settingsApi = {
  getPayroll: () => get('/settings/payroll'),
  updatePayroll: (data) => put('/settings/payroll', data),
};
