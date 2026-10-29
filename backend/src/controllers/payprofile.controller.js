/**
 * payprofile.controller.js — Hồ sơ lương của từng nhân viên:
 *  - cấu hình lương riêng (phụ cấp riêng, số người phụ thuộc)
 *  - thưởng / phạt theo tháng
 * Lịch sử các tháng lấy từ GET /api/payroll/employee/:employeeId (đã có sẵn).
 */
const prisma = require('../config/database');
const payrollService = require('../services/payroll.service');
const { success, created, ApiError } = require('../utils/response');
const { toNumber } = require('../utils/helpers');

const formatConfig = (employeeId, c) => ({
  employeeId,
  allowance: c ? toNumber(c.allowance) : 0,
  allowanceNote: c ? c.allowanceNote : null,
  dependents: c ? c.dependents : 0,
  updatedAt: c ? c.updatedAt : null,
});
const formatAdj = (a) => ({ ...a, amount: toNumber(a.amount) });

async function assertEmployee(id) {
  const e = await prisma.employee.findUnique({ where: { id }, select: { id: true } });
  if (!e) throw ApiError.notFound('Khong tim thay nhan vien');
}

// Nếu tháng đã có bảng lương của nhân viên (và chưa chốt) thì tính lại ngay để số liệu luôn khớp thưởng/phạt/cấu hình mới
async function recalcIfExists(employeeId, month) {
  const exist = await prisma.payroll.findUnique({ where: { employeeId_month: { employeeId, month } } });
  if (exist) await payrollService.calculatePayroll({ month, employeeId });
}

// GET /api/employees/:id/pay-config  (chưa cấu hình -> trả mặc định 0)
async function getPayConfig(req, res, next) {
  try {
    const id = Number(req.params.id);
    await assertEmployee(id);
    const c = await prisma.employeePayConfig.findUnique({ where: { employeeId: id } });
    return success(res, formatConfig(id, c), 'Lay cau hinh luong rieng thanh cong');
  } catch (err) { next(err); }
}

// PUT /api/employees/:id/pay-config — áp dụng từ lần tính lương tiếp theo
async function updatePayConfig(req, res, next) {
  try {
    const id = Number(req.params.id);
    await assertEmployee(id);
    const data = { allowance: req.body.allowance, allowanceNote: req.body.allowanceNote || null, dependents: req.body.dependents };
    const c = await prisma.employeePayConfig.upsert({ where: { employeeId: id }, update: data, create: { employeeId: id, ...data } });
    return success(res, formatConfig(id, c), 'Cap nhat cau hinh luong rieng thanh cong');
  } catch (err) { next(err); }
}

// GET /api/payroll/employee/:employeeId/adjustments?month=
async function listAdjustments(req, res, next) {
  try {
    const where = { employeeId: Number(req.params.employeeId) };
    if (req.query.month) where.month = req.query.month;
    const rows = await prisma.payrollAdjustment.findMany({ where, orderBy: [{ month: 'desc' }, { id: 'asc' }] });
    return success(res, rows.map(formatAdj), 'Lay thuong/phat thanh cong');
  } catch (err) { next(err); }
}

// POST /api/payroll/adjustments
async function createAdjustment(req, res, next) {
  try {
    const { employeeId, month } = req.body;
    await assertEmployee(employeeId);
    await payrollService.assertNotLocked(month); // thang da chot -> khong sua
    const row = await prisma.payrollAdjustment.create({ data: { ...req.body, createdBy: req.user.fullName || req.user.username } });
    await recalcIfExists(employeeId, month);
    return created(res, formatAdj(row), req.body.type === 'BONUS' ? 'Da them khoan thuong' : 'Da them khoan phat');
  } catch (err) { next(err); }
}

// DELETE /api/payroll/adjustments/:id
async function removeAdjustment(req, res, next) {
  try {
    const id = Number(req.params.id);
    const row = await prisma.payrollAdjustment.findUnique({ where: { id } });
    if (!row) throw ApiError.notFound('Khong tim thay khoan thuong/phat');
    await payrollService.assertNotLocked(row.month);
    await prisma.payrollAdjustment.delete({ where: { id } });
    await recalcIfExists(row.employeeId, row.month);
    return success(res, null, 'Da xoa khoan thuong/phat');
  } catch (err) { next(err); }
}

module.exports = { getPayConfig, updatePayConfig, listAdjustments, createAdjustment, removeAdjustment };
