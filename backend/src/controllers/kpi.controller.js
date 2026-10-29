const prisma = require('../config/database');
const kpiService = require('../services/kpi.service');
const { success, ApiError } = require('../utils/response');
const { toNumber } = require('../utils/helpers');

const include = {
  employee: { select: { id: true, employeeCode: true, name: true, position: true, department: { select: { id: true, name: true } } } },
};
const format = (k) => ({
  ...k,
  completionRate: toNumber(k.completionRate), onTimeRate: toNumber(k.onTimeRate), qualityScore: toNumber(k.qualityScore), total: toNumber(k.total),
});

// KPI được TÍNH TỰ ĐỘNG từ đầu việc (xem services/kpi.service.js) nên ở đây chỉ có đọc + tính lại, không có tạo/sửa tay.

// GET /api/kpi?period=&employeeId=
async function getAll(req, res, next) {
  try {
    const where = {};
    if (req.query.period) where.period = req.query.period;
    if (req.query.employeeId) where.employeeId = Number(req.query.employeeId);
    const rows = await prisma.kpi.findMany({ where, include, orderBy: [{ period: 'desc' }, { total: 'desc' }] });
    return success(res, rows.map(format), 'Lấy danh sách KPI thành công');
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const row = await prisma.kpi.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!row) throw ApiError.notFound('Không tìm thấy KPI');
    return success(res, format(row), 'Lấy KPI thành công');
  } catch (err) { next(err); }
}

async function getByEmployee(req, res, next) {
  try {
    const rows = await prisma.kpi.findMany({ where: { employeeId: Number(req.params.employeeId) }, include, orderBy: { period: 'desc' } });
    return success(res, rows.map(format), 'Lấy KPI cá nhân thành công');
  } catch (err) { next(err); }
}

// POST /api/kpi/recalculate { period, employeeId? } — dựng lại KPI từ đầu việc (vd. sau khi đổi công thức)
async function recalculate(req, res, next) {
  try {
    const { period, employeeId } = req.body;
    if (employeeId && !(await prisma.employee.findUnique({ where: { id: employeeId } }))) throw ApiError.notFound('Không tìm thấy nhân viên');
    const rows = await kpiService.recalcPeriod(period, employeeId);
    const full = await prisma.kpi.findMany({ where: { id: { in: rows.map((r) => r.id) } }, include, orderBy: { total: 'desc' } });
    return success(res, full.map(format), `Đã tính lại KPI kỳ ${period}`);
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, getByEmployee, recalculate };
