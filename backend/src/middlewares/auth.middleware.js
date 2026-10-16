const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');
const { ApiError } = require('../utils/response');

// Kiem tra JWT trong header: Authorization: Bearer <token>
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Thieu token xac thuc');
    }
    const token = header.slice(7).trim();
    let payload;
    try {
      payload = verifyToken(token);
    } catch (e) {
      throw ApiError.unauthorized('Token khong hop le hoac da het han');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true, username: true, role: true, fullName: true, isActive: true,
        employee: { select: { id: true, employeeCode: true, name: true, departmentId: true } },
      },
    });

    if (!user || !user.isActive) throw ApiError.unauthorized('Tai khoan khong ton tai hoac da bi khoa');

    req.user = user;          // khong bao gio chua password
    req.employeeId = user.employee ? user.employee.id : null;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
