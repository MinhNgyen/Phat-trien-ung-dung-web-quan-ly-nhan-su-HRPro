const { ApiError } = require('../utils/response');

// authorize('ADMIN', 'HR') - chi cho phep cac role duoc liet ke
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Ban khong co quyen thuc hien thao tac nay'));
    }
    next();
  };
}

// EMPLOYEE chi duoc xem du lieu cua chinh minh
function selfOrRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (roles.includes(req.user.role)) return next();
    const targetId = Number(req.params.employeeId || req.params.id);
    if (req.employeeId && req.employeeId === targetId) return next();
    return next(ApiError.forbidden('Ban chi duoc xem du lieu cua chinh minh'));
  };
}

module.exports = { authorize, selfOrRoles };
