const prisma = require('../config/database');
const kpiService = require('../services/kpi.service');
const { success, created, ApiError } = require('../utils/response');
const { monthRange, toDateOnly } = require('../utils/helpers');

const include = {
  employee: { select: { id: true, employeeCode: true, name: true, department: { select: { id: true, name: true } } } },
};
const day = (d) => (d ? d.toISOString().slice(0, 10) : null);
// Ngày (YYYY-MM-DD) dạng chuỗi cho JSON gọn; field Date của Prisma tự thành ISO
const format = (t) => ({ ...t, dueDate: day(t.dueDate), completedAt: day(t.completedAt) });

const isManager = (req) => ['ADMIN', 'HR', 'MANAGER'].includes(req.user.role);
function assertCanSee(req, task) {
  if (req.user.role === 'EMPLOYEE' && task.employeeId !== req.employeeId) throw ApiError.forbidden('Bạn chỉ được xem việc của chính mình');
}

// GET /api/tasks?employeeId=&period=YYYY-MM&status=
async function getAll(req, res, next) {
  try {
    const { employeeId, period, status } = req.query;
    const where = {};
    if (employeeId) where.employeeId = Number(employeeId);
    if (status) where.status = status;
    if (period) { const { start, end } = monthRange(period); where.dueDate = { gte: start, lt: end }; }
    const rows = await prisma.task.findMany({ where, include, orderBy: [{ dueDate: 'asc' }, { id: 'asc' }] });
    return success(res, rows.map(format), 'Lấy danh sách đầu việc thành công');
  } catch (err) { next(err); }
}

// GET /api/tasks/employee/:employeeId?period=   (nhân viên chỉ xem của mình — chặn ở route)
async function getByEmployee(req, res, next) {
  try {
    const where = { employeeId: Number(req.params.employeeId) };
    if (req.query.period) { const { start, end } = monthRange(req.query.period); where.dueDate = { gte: start, lt: end }; }
    const rows = await prisma.task.findMany({ where, include, orderBy: [{ dueDate: 'asc' }, { id: 'asc' }] });
    return success(res, rows.map(format), 'Lấy đầu việc của nhân viên thành công');
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const t = await prisma.task.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!t) throw ApiError.notFound('Không tìm thấy đầu việc');
    assertCanSee(req, t);
    return success(res, format(t), 'Lấy đầu việc thành công');
  } catch (err) { next(err); }
}

// POST /api/tasks — giao việc cho nhân viên
async function create(req, res, next) {
  try {
    const emp = await prisma.employee.findUnique({ where: { id: req.body.employeeId } });
    if (!emp) throw ApiError.notFound('Không tìm thấy nhân viên');
    const task = await prisma.task.create({
      data: { ...req.body, dueDate: toDateOnly(req.body.dueDate), assignedBy: req.user.fullName || req.user.username },
      include,
    });
    await kpiService.recalcAffected([{ employeeId: task.employeeId, dueDate: task.dueDate }]);
    return created(res, format(task), 'Giao việc thành công');
  } catch (err) { next(err); }
}

// PUT /api/tasks/:id — sửa việc / duyệt hoàn thành (DONE bắt buộc có điểm chất lượng)
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.task.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Không tìm thấy đầu việc');

    const data = { ...req.body };
    if (data.dueDate) data.dueDate = toDateOnly(data.dueDate);
    if (data.completedAt) data.completedAt = toDateOnly(data.completedAt);
    const status = data.status || exist.status;

    if (status === 'DONE') {
      const quality = data.quality !== undefined ? data.quality : exist.quality;
      if (quality == null) throw ApiError.badRequest('Dữ liệu không hợp lệ', [{ field: 'quality', message: 'Cần chấm điểm chất lượng (0-100) khi đánh dấu hoàn thành' }]);
      data.quality = quality;
      data.completedAt = data.completedAt || exist.completedAt || toDateOnly(new Date()); // mặc định: hôm nay
    } else if (data.status) {
      // mở lại / đổi sang trạng thái khác: bỏ thông tin hoàn thành
      data.completedAt = null;
      data.quality = null;
    }

    const task = await prisma.task.update({ where: { id }, data, include });
    // tính lại cả (nhân viên, kỳ) cũ lẫn mới nếu đổi người nhận hoặc đổi hạn sang tháng khác
    await kpiService.recalcAffected([{ employeeId: exist.employeeId, dueDate: exist.dueDate }, { employeeId: task.employeeId, dueDate: task.dueDate }]);
    return success(res, format(task), 'Cập nhật đầu việc thành công');
  } catch (err) { next(err); }
}

// PATCH /api/tasks/:id/status — nhân viên tự báo tiến độ việc của mình (TODO / IN_PROGRESS / REVIEW)
async function updateStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.task.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Không tìm thấy đầu việc');
    if (!isManager(req) && exist.employeeId !== req.employeeId) throw ApiError.forbidden('Bạn chỉ được cập nhật việc của chính mình');
    if (exist.status === 'DONE' || exist.status === 'CANCELLED') throw ApiError.badRequest('Việc đã hoàn thành hoặc đã hủy, không thể đổi trạng thái');
    const task = await prisma.task.update({ where: { id }, data: { status: req.body.status }, include });
    return success(res, format(task), 'Cập nhật trạng thái thành công'); // DONE/REVIEW chưa tính vào KPI nên không cần tính lại
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.task.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Không tìm thấy đầu việc');
    await prisma.task.delete({ where: { id } });
    await kpiService.recalcAffected([{ employeeId: exist.employeeId, dueDate: exist.dueDate }]);
    return success(res, null, 'Xóa đầu việc thành công');
  } catch (err) { next(err); }
}

module.exports = { getAll, getByEmployee, getById, create, update, updateStatus, remove };
