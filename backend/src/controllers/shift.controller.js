const prisma = require('../config/database');
const { success, created, ApiError } = require('../utils/response');

// GET /api/shifts
async function getAll(req, res, next) {
  try {
    const items = await prisma.shift.findMany({
      include: { _count: { select: { employeeShifts: true } } },
      orderBy: { id: 'asc' },
    });
    const data = items.map((s) => ({ ...s, employeeCount: s._count.employeeShifts, _count: undefined }));
    return success(res, data, 'Lay danh sach ca lam thanh cong');
  } catch (err) { next(err); }
}

// GET /api/shifts/:id
async function getById(req, res, next) {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        employeeShifts: {
          include: { employee: { select: { id: true, employeeCode: true, name: true } } },
        },
      },
    });
    if (!shift) throw ApiError.notFound('Khong tim thay ca lam');
    return success(res, shift, 'Lay thong tin ca lam thanh cong');
  } catch (err) { next(err); }
}

// POST /api/shifts
async function create(req, res, next) {
  try {
    const dup = await prisma.shift.findUnique({ where: { code: req.body.code } });
    if (dup) throw ApiError.conflict('Ma ca lam da ton tai');
    const shift = await prisma.shift.create({ data: req.body });
    return created(res, shift, 'Them ca lam thanh cong');
  } catch (err) { next(err); }
}

// PUT /api/shifts/:id
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.shift.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay ca lam');
    if (req.body.code) {
      const dup = await prisma.shift.findFirst({ where: { code: req.body.code, id: { not: id } } });
      if (dup) throw ApiError.conflict('Ma ca lam da ton tai');
    }
    const shift = await prisma.shift.update({ where: { id }, data: req.body });
    return success(res, shift, 'Cap nhat ca lam thanh cong');
  } catch (err) { next(err); }
}

// DELETE /api/shifts/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.shift.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay ca lam');
    await prisma.shift.delete({ where: { id } }); // employee_shifts cascade
    return success(res, null, 'Xoa ca lam thanh cong');
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove };
