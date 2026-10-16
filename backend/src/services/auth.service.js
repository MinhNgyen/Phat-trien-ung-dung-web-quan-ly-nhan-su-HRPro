const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { signToken } = require('../utils/jwt');
const { ApiError } = require('../utils/response');

const SALT_ROUNDS = 10;

async function login(username, password) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { employee: { include: { department: true } } },
  });

  // Thong bao chung chung de tranh do doan tai khoan
  if (!user) throw ApiError.unauthorized('Ten dang nhap hoac mat khau khong dung');
  if (!user.isActive) throw ApiError.forbidden('Tai khoan da bi khoa');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw ApiError.unauthorized('Ten dang nhap hoac mat khau khong dung');

  const token = signToken({ id: user.id, username: user.username, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            name: user.employee.name,
            department: user.employee.department
              ? { id: user.employee.department.id, name: user.employee.department.name }
              : null,
          }
        : null,
    },
  };
}

async function register({ username, password, fullName, role, employeeId }) {
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) throw ApiError.conflict('Ten dang nhap da ton tai');

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { username, password: hashed, fullName, role },
    select: { id: true, username: true, fullName: true, role: true, createdAt: true },
  });

  // Gan user vao nhan vien neu co
  if (employeeId) {
    await prisma.employee.update({ where: { id: employeeId }, data: { userId: user.id } });
  }
  return user;
}

async function changePassword(userId, oldPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('Tai khoan khong ton tai');

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw ApiError.badRequest('Mat khau cu khong dung');

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  return true;
}

module.exports = { login, register, changePassword, SALT_ROUNDS };
