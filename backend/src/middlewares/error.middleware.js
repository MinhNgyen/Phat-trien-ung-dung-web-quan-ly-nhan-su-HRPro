const { Prisma } = require('@prisma/client');
const { error } = require('../utils/response');

// 404 cho route khong ton tai
function notFoundHandler(req, res) {
  return error(res, `Khong tim thay endpoint: ${req.method} ${req.originalUrl}`, 404);
}

// Xu ly loi tap trung - khong lo thong tin nhay cam ra ngoai
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (process.env.NODE_ENV === 'development') console.error(err);

  // Loi do minh chu dong nem ra (ApiError)
  if (err.status) return error(res, err.message, err.status, err.errors || []);

  // Loi rang buoc cua Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta && err.meta.target) || [];
      return error(res, 'Du lieu da ton tai (trung lap)', 409, [{ field: String(fields), message: 'Gia tri bi trung' }]);
    }
    if (err.code === 'P2003') return error(res, 'Du lieu tham chieu khong hop le', 400);
    if (err.code === 'P2025') return error(res, 'Khong tim thay ban ghi', 404);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return error(res, 'Du lieu gui len khong hop le', 400);
  }

  return error(res, 'Loi he thong, vui long thu lai sau', 500);
}

module.exports = { notFoundHandler, errorHandler };
