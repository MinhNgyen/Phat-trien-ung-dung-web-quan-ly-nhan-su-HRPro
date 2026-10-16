const prisma = require('../config/database');
const { success, created, ApiError } = require('../utils/response');
const { calcWorkHours, calcLateMinutes, calcEarlyMinutes, toDateOnly, monthRange } = require('../utils/helpers');

const include = {
  employee: {
    select: { id: true, employeeCode: true, name: true, department: { select: { id: true, name: true } } },
  },
  shift: { select: { id: true, code: true, name: true, startTime: true, endTime: true } },
};

function format(row) {
  return { ...row, workHours: Number(row.workHours), date: row.date.toISOString().slice(0, 10) };
}

/**
 * Tinh workHours / lateMinutes / status tu du lieu cham cong.
 * Neu client gui san status thi ton trong status do (vd: LEAVE, ABSENT).
 */
async function buildRecord(data, existing = {}) {
  const merged = { ...existing, ...data };
  const shiftId = merged.shiftId || null;
  let shift = null;
  if (shiftId) shift = await prisma.shift.findUnique({ where: { id: shiftId } });

  const checkIn = merged.checkIn || null;
  const checkOut = merged.checkOut || null;

  const workHours = checkIn && checkOut ? calcWorkHours(checkIn, checkOut) : 0;
  // Di muon = vao tre hon (gio bat dau ca + so phut cho phep muon cua ca do)
  const grace = shift && shift.graceMinutes != null ? shift.graceMinutes : 0;
  const lateMinutes = checkIn && shift ? calcLateMinutes(checkIn, shift.startTime, grace) : 0;
  const earlyMinutes = checkOut && shift ? calcEarlyMinutes(checkOut, shift.startTime, shift.endTime) : 0;

  let status = data.status || merged.status;
  if (!data.status) {
    // Tu dong xac dinh: khong co gio vao -> vang; di muon HOAC ve som -> LATE; con lai -> PRESENT
    if (!checkIn) status = 'ABSENT';
    else if (lateMinutes > 0 || earlyMinutes > 0) status = 'LATE';
    else status = 'PRESENT';
  }

  return {
    employeeId: merged.employeeId,
    shiftId,
    date: toDateOnly(merged.date),
    checkIn, checkOut, workHours, lateMinutes,
    status,
    type: merged.type || 'NORMAL',
    note: merged.note ?? null,
  };
}

// GET /api/attendance?employeeId=&date=&month=&status=&from=&to=
async function getAll(req, res, next) {
  try {
    const { employeeId, date, month, status, from, to } = req.query;
    const where = {};
    if (employeeId) where.employeeId = Number(employeeId);
    if (status) where.status = status;
    if (date) where.date = toDateOnly(date);
    else if (month) {
      const { start, end } = monthRange(month);
      where.date = { gte: start, lt: end };
    } else if (from || to) {
      where.date = {};
      if (from) where.date.gte = toDateOnly(from);
      if (to) where.date.lte = toDateOnly(to);
    }

    const rows = await prisma.attendance.findMany({
      where, include, orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
    return success(res, rows.map(format), 'Lay danh sach cham cong thanh cong');
  } catch (err) { next(err); }
}

// GET /api/attendance/:id
async function getById(req, res, next) {
  try {
    const row = await prisma.attendance.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!row) throw ApiError.notFound('Khong tim thay ban ghi cham cong');
    return success(res, format(row), 'Lay ban ghi cham cong thanh cong');
  } catch (err) { next(err); }
}

// GET /api/attendance/employee/:employeeId?month=
async function getByEmployee(req, res, next) {
  try {
    const where = { employeeId: Number(req.params.employeeId) };
    if (req.query.month) {
      const { start, end } = monthRange(req.query.month);
      where.date = { gte: start, lt: end };
    }
    const rows = await prisma.attendance.findMany({ where, include, orderBy: { date: 'desc' } });
    return success(res, rows.map(format), 'Lay cham cong theo nhan vien thanh cong');
  } catch (err) { next(err); }
}

// GET /api/attendance/date/:date  (YYYY-MM-DD)
async function getByDate(req, res, next) {
  try {
    const rows = await prisma.attendance.findMany({
      where: { date: toDateOnly(req.params.date) }, include, orderBy: { employeeId: 'asc' },
    });
    return success(res, rows.map(format), 'Lay cham cong theo ngay thanh cong');
  } catch (err) { next(err); }
}

// POST /api/attendance
async function create(req, res, next) {
  try {
    const data = await buildRecord(req.body);

    const emp = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!emp) throw ApiError.notFound('Khong tim thay nhan vien');

    // Khong cho phep trung employee + shift + date
    const dup = await prisma.attendance.findFirst({
      where: { employeeId: data.employeeId, shiftId: data.shiftId, date: data.date },
    });
    if (dup) throw ApiError.conflict('Da ton tai ban ghi cham cong cho nhan vien nay trong ngay/ca nay');

    const row = await prisma.attendance.create({ data, include });
    return created(res, format(row), 'Cham cong thanh cong');
  } catch (err) { next(err); }
}

// PUT /api/attendance/:id - dung cho ca cham cong ra (check-out)
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.attendance.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay ban ghi cham cong');

    const data = await buildRecord(req.body, exist);
    const row = await prisma.attendance.update({ where: { id }, data, include });
    return success(res, format(row), 'Cap nhat cham cong thanh cong');
  } catch (err) { next(err); }
}

// POST /api/attendance/check-in  { employeeId, shiftId?, date? }
async function checkIn(req, res, next) {
  try {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const body = { ...req.body, date: req.body.date || now, checkIn: req.body.checkIn || time };
    req.body = body;
    return create(req, res, next);
  } catch (err) { next(err); }
}

// POST /api/attendance/check-out  { employeeId, date? }
async function checkOut(req, res, next) {
  try {
    const now = new Date();
    const time = req.body.checkOut ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const date = toDateOnly(req.body.date || now);

    const record = await prisma.attendance.findFirst({
      where: { employeeId: Number(req.body.employeeId), date },
      orderBy: { id: 'desc' },
    });
    if (!record) throw ApiError.notFound('Chua co ban ghi cham cong vao cho hom nay');

    const data = await buildRecord({ checkOut: time }, record);
    const row = await prisma.attendance.update({ where: { id: record.id }, data, include });
    return success(res, format(row), 'Cham cong ra thanh cong');
  } catch (err) { next(err); }
}

// DELETE /api/attendance/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.attendance.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay ban ghi cham cong');
    await prisma.attendance.delete({ where: { id } });
    return success(res, null, 'Xoa ban ghi cham cong thanh cong');
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, getByEmployee, getByDate, create, update, remove, checkIn, checkOut };
