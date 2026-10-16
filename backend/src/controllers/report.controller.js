const reportService = require('../services/report.service');
const { success } = require('../utils/response');

// GET /api/reports/dashboard
async function dashboard(req, res, next) {
  try {
    const data = await reportService.getDashboard();
    delete data._range;
    return success(res, data, 'Lay du lieu dashboard thanh cong');
  } catch (err) { next(err); }
}

// GET /api/reports/employees
async function employees(req, res, next) {
  try {
    return success(res, await reportService.getEmployeeReport(), 'Lay bao cao nhan su thanh cong');
  } catch (err) { next(err); }
}

// GET /api/reports/attendance?month=YYYY-MM
async function attendance(req, res, next) {
  try {
    return success(res, await reportService.getAttendanceReport(req.query.month), 'Lay bao cao cham cong thanh cong');
  } catch (err) { next(err); }
}

// GET /api/reports/payroll?month=YYYY-MM
async function payroll(req, res, next) {
  try {
    return success(res, await reportService.getPayrollReport(req.query.month), 'Lay bao cao luong thanh cong');
  } catch (err) { next(err); }
}

// GET /api/reports/kpi?period=YYYY-MM
async function kpi(req, res, next) {
  try {
    return success(res, await reportService.getKpiReport(req.query.period), 'Lay bao cao KPI thanh cong');
  } catch (err) { next(err); }
}

module.exports = { dashboard, employees, attendance, payroll, kpi };
