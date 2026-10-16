const prisma = require('../config/database');
const { success, created, ApiError } = require('../utils/response');

// Bo cuc include dung chung: kem phong ban + ca duoc phan cong
const employeeInclude = {
  department: { select: { id: true, code: true, name: true, color: true } },
  employeeShifts: { include: { shift: true } },
  user: { select: { id: true, username: true, role: true } },
};

// Chuan hoa du lieu tra ve cho frontend
function format(emp) {
  if (!emp) return emp;
  const { employeeShifts, ...rest } = emp;
  return {
    ...rest,
    salary: Number(rest.salary),
    shifts: (employeeShifts || []).map((es) => ({
      id: es.shift.id, code: es.shift.code, name: es.shift.name,
      startTime: es.shift.startTime, endTime: es.shift.endTime,
      isPrimary: es.isPrimary,
    })),
  };
}

// GET /api/employees?search=&departmentId=&status=&page=&limit=
async function getAll(req, res, next) {
  try {
    const { search, departmentId, status, page, limit } = req.query;
    const where = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = Number(departmentId);
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { employeeCode: { contains: search } },
        { email: { contains: search } },
        { position: { contains: search } },
      ];
    }

    const take = limit ? Number(limit) : undefined;
    const skip = page && limit ? (Number(page) - 1) * Number(limit) : undefined;

    const [items, total] = await Promise.all([
      prisma.employee.findMany({ where, include: employeeInclude, orderBy: { id: 'asc' }, take, skip }),
      prisma.employee.count({ where }),
    ]);

    return success(res, { items: items.map(format), total }, 'Lay danh sach nhan vien thanh cong');
  } catch (err) { next(err); }
}

// GET /api/employees/:id
async function getById(req, res, next) {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: Number(req.params.id) },
      include: employeeInclude,
    });
    if (!emp) throw ApiError.notFound('Khong tim thay nhan vien');
    return success(res, format(emp), 'Lay thong tin nhan vien thanh cong');
  } catch (err) { next(err); }
}

// POST /api/employees
async function create(req, res, next) {
  try {
    const data = req.body;
    // Kiem tra trung ma / email truoc khi ghi DB
    const dup = await prisma.employee.findFirst({
      where: { OR: [{ employeeCode: data.employeeCode }, { email: data.email }] },
    });
    if (dup) throw ApiError.conflict('Ma nhan vien hoac email da ton tai');

    if (data.departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!dept) throw ApiError.badRequest('Phong ban khong ton tai');
    }

    const emp = await prisma.employee.create({ data, include: employeeInclude });
    return created(res, format(emp), 'Them nhan vien thanh cong');
  } catch (err) { next(err); }
}

// PUT /api/employees/:id
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.employee.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay nhan vien');

    const data = req.body;
    if (data.employeeCode || data.email) {
      const dup = await prisma.employee.findFirst({
        where: {
          id: { not: id },
          OR: [
            data.employeeCode ? { employeeCode: data.employeeCode } : undefined,
            data.email ? { email: data.email } : undefined,
          ].filter(Boolean),
        },
      });
      if (dup) throw ApiError.conflict('Ma nhan vien hoac email da ton tai');
    }

    const emp = await prisma.employee.update({ where: { id }, data, include: employeeInclude });
    return success(res, format(emp), 'Cap nhat nhan vien thanh cong');
  } catch (err) { next(err); }
}

// DELETE /api/employees/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.employee.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay nhan vien');
    await prisma.employee.delete({ where: { id } });
    return success(res, null, 'Xoa nhan vien thanh cong');
  } catch (err) { next(err); }
}

// GET /api/employees/:id/shifts
async function getShifts(req, res, next) {
  try {
    const employeeId = Number(req.params.id);
    const rows = await prisma.employeeShift.findMany({
      where: { employeeId },
      include: { shift: true },
      orderBy: { isPrimary: 'desc' },
    });
    return success(res, rows, 'Lay ca lam cua nhan vien thanh cong');
  } catch (err) { next(err); }
}

// POST /api/employees/:id/shifts  { shiftId, isPrimary }
async function assignShift(req, res, next) {
  try {
    const employeeId = Number(req.params.id);
    const { shiftId, isPrimary } = req.body;

    const [emp, shift] = await Promise.all([
      prisma.employee.findUnique({ where: { id: employeeId } }),
      prisma.shift.findUnique({ where: { id: shiftId } }),
    ]);
    if (!emp) throw ApiError.notFound('Khong tim thay nhan vien');
    if (!shift) throw ApiError.notFound('Khong tim thay ca lam');

    // Khong cho phep trung employee + shift
    const dup = await prisma.employeeShift.findUnique({
      where: { employeeId_shiftId: { employeeId, shiftId } },
    });
    if (dup) throw ApiError.conflict('Nhan vien da duoc phan cong ca nay');

    // Chi co 1 ca chinh
    if (isPrimary) {
      await prisma.employeeShift.updateMany({ where: { employeeId }, data: { isPrimary: false } });
    }

    const row = await prisma.employeeShift.create({
      data: { employeeId, shiftId, isPrimary: !!isPrimary },
      include: { shift: true },
    });
    return created(res, row, 'Phan ca thanh cong');
  } catch (err) { next(err); }
}

// DELETE /api/employees/:id/shifts/:shiftId
async function removeShift(req, res, next) {
  try {
    const employeeId = Number(req.params.id);
    const shiftId = Number(req.params.shiftId);
    const row = await prisma.employeeShift.findUnique({
      where: { employeeId_shiftId: { employeeId, shiftId } },
    });
    if (!row) throw ApiError.notFound('Nhan vien chua duoc phan ca nay');
    await prisma.employeeShift.delete({ where: { id: row.id } });
    return success(res, null, 'Huy phan ca thanh cong');
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove, getShifts, assignShift, removeShift };
