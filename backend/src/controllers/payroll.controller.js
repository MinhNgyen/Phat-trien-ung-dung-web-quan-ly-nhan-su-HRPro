const prisma = require('../config/database');
const payrollService = require('../services/payroll.service');
const { success, created, ApiError } = require('../utils/response');
const { toNumber } = require('../utils/helpers');

const include = {
  employee: {
    select: { id: true, employeeCode: true, name: true, position: true, department: { select: { id: true, name: true } } },
  },
};

function format(p) {
  return {
    ...p,
    baseSalary: toNumber(p.baseSalary),
    overtime: toNumber(p.overtime),
    allowance: toNumber(p.allowance),
    bonus: toNumber(p.bonus),
    deduction: toNumber(p.deduction),
    grossSalary: toNumber(p.grossSalary),
    tax: toNumber(p.tax),
    netSalary: toNumber(p.netSalary),
  };
}

// GET /api/payroll?month=&employeeId=
async function getAll(req, res, next) {
  try {
    const where = {};
    if (req.query.month) where.month = req.query.month;
    if (req.query.employeeId) where.employeeId = Number(req.query.employeeId);
    const rows = await prisma.payroll.findMany({ where, include, orderBy: [{ month: 'desc' }, { employeeId: 'asc' }] });
    return success(res, rows.map(format), 'Lay bang luong thanh cong');
  } catch (err) { next(err); }
}

// GET /api/payroll/month/:month  va GET /api/payroll/:month
async function getByMonth(req, res, next) {
  try {
    const month = req.params.month;
    if (!/^\d{4}-\d{2}$/.test(month)) throw ApiError.badRequest('Thang phai co dang YYYY-MM');
    const [rows, lock] = await Promise.all([
      prisma.payroll.findMany({ where: { month }, include, orderBy: { employeeId: 'asc' } }),
      prisma.salaryLock.findUnique({ where: { month } }),
    ]);
    return success(res, {
      month,
      isLocked: !!(lock && lock.isLocked),
      items: rows.map(format),
      totalNet: rows.reduce((s, r) => s + toNumber(r.netSalary), 0),
    }, 'Lay bang luong theo thang thanh cong');
  } catch (err) { next(err); }
}

// GET /api/payroll/employee/:employeeId
async function getByEmployee(req, res, next) {
  try {
    const rows = await prisma.payroll.findMany({
      where: { employeeId: Number(req.params.employeeId) }, include, orderBy: { month: 'desc' },
    });
    return success(res, rows.map(format), 'Lay bang luong ca nhan thanh cong');
  } catch (err) { next(err); }
}

// POST /api/payroll/calculate  { month, employeeId?, allowance?, deduction? }
async function calculate(req, res, next) {
  try {
    const rows = await payrollService.calculatePayroll(req.body);
    return created(res, rows.map(format), `Tinh luong thang ${req.body.month} thanh cong`);
  } catch (err) { next(err); }
}

// PUT /api/payroll/:id - chi sua duoc khi thang chua khoa
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.payroll.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay bang luong');
    await payrollService.assertNotLocked(exist.month);

    const allowed = ['allowance', 'bonus', 'deduction', 'overtime', 'workDays', 'baseSalary', 'note'];
    const data = {};
    for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];

    // Tinh lai gross/net sau khi sua. Giam tru gia canh: uu tien muc RIENG cua nhan vien da luu luc tinh luong
    // (gom nguoi phu thuoc), neu khong co thi dung muc chung trong cau hinh.
    const merged = { ...exist, ...data };
    const gross = toNumber(merged.baseSalary) + toNumber(merged.overtime) + toNumber(merged.allowance) + toNumber(merged.bonus) - toNumber(merged.deduction);
    const settings = await payrollService.getSettings();
    const relief = exist.breakdown && exist.breakdown.taxRelief != null ? exist.breakdown.taxRelief : settings.personalRelief;
    data.grossSalary = gross;
    data.tax = payrollService.calcTax(gross, relief);
    data.netSalary = gross - data.tax;

    const row = await prisma.payroll.update({ where: { id }, data, include });
    return success(res, format(row), 'Cap nhat bang luong thanh cong');
  } catch (err) { next(err); }
}

// DELETE /api/payroll/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.payroll.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay bang luong');
    await payrollService.assertNotLocked(exist.month);
    await prisma.payroll.delete({ where: { id } });
    return success(res, null, 'Xoa bang luong thanh cong');
  } catch (err) { next(err); }
}

// POST /api/payroll/lock  { month }
async function lock(req, res, next) {
  try {
    const row = await payrollService.lockMonth(req.body.month, req.user.id);
    return success(res, row, `Da khoa bang luong thang ${req.body.month}`);
  } catch (err) { next(err); }
}

// POST /api/payroll/unlock  { month } - chi ADMIN
async function unlock(req, res, next) {
  try {
    const row = await payrollService.unlockMonth(req.body.month, req.user.id);
    return success(res, row, `Da mo khoa bang luong thang ${req.body.month}`);
  } catch (err) { next(err); }
}

// GET /api/payroll/locks
async function getLocks(req, res, next) {
  try {
    const rows = await prisma.salaryLock.findMany({ orderBy: { month: 'desc' } });
    return success(res, rows, 'Lay danh sach thang da khoa thanh cong');
  } catch (err) { next(err); }
}

module.exports = { getAll, getByMonth, getByEmployee, calculate, update, remove, lock, unlock, getLocks };
