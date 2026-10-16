const authService = require('../services/auth.service');
const prisma = require('../config/database');
const { success, created, ApiError } = require('../utils/response');

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const data = await authService.login(username, password);
    return success(res, data, 'Dang nhap thanh cong');
  } catch (err) { next(err); }
}

// GET /api/auth/me
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true,
        employee: { include: { department: true } },
      },
    });
    if (!user) throw ApiError.notFound('Tai khoan khong ton tai');
    return success(res, user, 'Lay thong tin tai khoan thanh cong');
  } catch (err) { next(err); }
}

// POST /api/auth/register  (chi ADMIN)
async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    return created(res, user, 'Tao tai khoan thanh cong');
  } catch (err) { next(err); }
}

// PUT /api/auth/change-password
async function changePassword(req, res, next) {
  try {
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, oldPassword, newPassword);
    return success(res, null, 'Doi mat khau thanh cong');
  } catch (err) { next(err); }
}

// GET /api/auth/users (chi ADMIN)
async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true,
        employee: { select: { id: true, employeeCode: true, name: true } },
      },
      orderBy: { id: 'asc' },
    });
    return success(res, users, 'Lay danh sach tai khoan thanh cong');
  } catch (err) { next(err); }
}

module.exports = { login, me, register, changePassword, listUsers };
