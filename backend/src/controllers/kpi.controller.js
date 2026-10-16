const prisma = require('../config/database');
const { success, created, ApiError } = require('../utils/response');
const { toNumber } = require('../utils/helpers');

const include = {
  employee: {
    select: { id: true, employeeCode: true, name: true, position: true, department: { select: { id: true, name: true } } },
  },
};

// Trong so cac tieu chi KPI - tong = 100%
const WEIGHTS = { sales: 0.25, attendance: 0.2, task: 0.25, deadline: 0.15, quality: 0.15 };

// Backend tu tinh tong KPI
function calcTotal(d) {
  const total =
    (d.sales || 0) * WEIGHTS.sales +
    (d.attendance || 0) * WEIGHTS.attendance +
    (d.task || 0) * WEIGHTS.task +
    (d.deadline || 0) * WEIGHTS.deadline +
    (d.quality || 0) * WEIGHTS.quality;
  return Math.round(total * 100) / 100;
}

const format = (k) => ({ ...k, total: toNumber(k.total) });

// GET /api/kpi?period=&employeeId=
async function getAll(req, res, next) {
  try {
    const where = {};
    if (req.query.period) where.period = req.query.period;
    if (req.query.employeeId) where.employeeId = Number(req.query.employeeId);
    const rows = await prisma.kpi.findMany({ where, include, orderBy: [{ period: 'desc' }, { total: 'desc' }] });
    return success(res, rows.map(format), 'Lay danh sach KPI thanh cong');
  } catch (err) { next(err); }
}

// GET /api/kpi/:id
async function getById(req, res, next) {
  try {
    const row = await prisma.kpi.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!row) throw ApiError.notFound('Khong tim thay KPI');
    return success(res, format(row), 'Lay KPI thanh cong');
  } catch (err) { next(err); }
}

// GET /api/kpi/employee/:employeeId
async function getByEmployee(req, res, next) {
  try {
    const rows = await prisma.kpi.findMany({
      where: { employeeId: Number(req.params.employeeId) }, include, orderBy: { period: 'desc' },
    });
    return success(res, rows.map(format), 'Lay KPI ca nhan thanh cong');
  } catch (err) { next(err); }
}

// POST /api/kpi
async function create(req, res, next) {
  try {
    const data = { ...req.body, total: calcTotal(req.body) };
    const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!emp) throw ApiError.notFound('Khong tim thay nhan vien');

    // Khong cho phep trung employee + period
    const dup = await prisma.kpi.findUnique({
      where: { employeeId_period: { employeeId: data.employeeId, period: data.period } },
    });
    if (dup) throw ApiError.conflict('KPI cua nhan vien trong ky nay da ton tai');

    const row = await prisma.kpi.create({ data, include });
    return created(res, format(row), 'Them KPI thanh cong');
  } catch (err) { next(err); }
}

// PUT /api/kpi/:id
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.kpi.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay KPI');

    const merged = { ...exist, ...req.body };
    const data = { ...req.body, total: calcTotal(merged) };
    const row = await prisma.kpi.update({ where: { id }, data, include });
    return success(res, format(row), 'Cap nhat KPI thanh cong');
  } catch (err) { next(err); }
}

// DELETE /api/kpi/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.kpi.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay KPI');
    await prisma.kpi.delete({ where: { id } });
    return success(res, null, 'Xoa KPI thanh cong');
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, getByEmployee, create, update, remove, calcTotal };
