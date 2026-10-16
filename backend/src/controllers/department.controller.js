const prisma = require('../config/database');
const { success, created, ApiError } = require('../utils/response');

// GET /api/departments
async function getAll(req, res, next) {
  try {
    const items = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { id: 'asc' },
    });
    const data = items.map((d) => ({ ...d, employeeCount: d._count.employees, _count: undefined }));
    return success(res, data, 'Lay danh sach phong ban thanh cong');
  } catch (err) { next(err); }
}

// GET /api/departments/:id - kem danh sach nhan vien
async function getById(req, res, next) {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        employees: {
          select: { id: true, employeeCode: true, name: true, email: true, position: true, status: true },
        },
      },
    });
    if (!dept) throw ApiError.notFound('Khong tim thay phong ban');
    return success(res, dept, 'Lay thong tin phong ban thanh cong');
  } catch (err) { next(err); }
}

// GET /api/departments/:id/employees
async function getEmployees(req, res, next) {
  try {
    const employees = await prisma.employee.findMany({
      where: { departmentId: Number(req.params.id) },
      orderBy: { id: 'asc' },
    });
    return success(res, employees.map((e) => ({ ...e, salary: Number(e.salary) })), 'Lay nhan vien phong ban thanh cong');
  } catch (err) { next(err); }
}

// POST /api/departments
async function create(req, res, next) {
  try {
    const dup = await prisma.department.findUnique({ where: { code: req.body.code } });
    if (dup) throw ApiError.conflict('Ma phong ban da ton tai');
    const dept = await prisma.department.create({ data: req.body });
    return created(res, dept, 'Them phong ban thanh cong');
  } catch (err) { next(err); }
}

// PUT /api/departments/:id
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.department.findUnique({ where: { id } });
    if (!exist) throw ApiError.notFound('Khong tim thay phong ban');
    if (req.body.code) {
      const dup = await prisma.department.findFirst({ where: { code: req.body.code, id: { not: id } } });
      if (dup) throw ApiError.conflict('Ma phong ban da ton tai');
    }
    const dept = await prisma.department.update({ where: { id }, data: req.body });
    return success(res, dept, 'Cap nhat phong ban thanh cong');
  } catch (err) { next(err); }
}

// DELETE /api/departments/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const exist = await prisma.department.findUnique({
      where: { id }, include: { _count: { select: { employees: true } } },
    });
    if (!exist) throw ApiError.notFound('Khong tim thay phong ban');
    if (exist._count.employees > 0) {
      throw ApiError.conflict('Khong the xoa phong ban dang co nhan vien');
    }
    await prisma.department.delete({ where: { id } });
    return success(res, null, 'Xoa phong ban thanh cong');
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, getEmployees, create, update, remove };
