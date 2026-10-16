// Chuan hoa response cho toan bo API
function success(res, data = null, message = 'Thanh cong', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function created(res, data = null, message = 'Tao moi thanh cong') {
  return success(res, data, message, 201);
}

function error(res, message = 'Co loi xay ra', status = 500, errors = []) {
  return res.status(status).json({ success: false, message, errors });
}

// Lop loi dung chung, duoc error.middleware bat lai
class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
  static badRequest(msg = 'Du lieu khong hop le', errors = []) { return new ApiError(400, msg, errors); }
  static unauthorized(msg = 'Chua dang nhap') { return new ApiError(401, msg); }
  static forbidden(msg = 'Khong co quyen truy cap') { return new ApiError(403, msg); }
  static notFound(msg = 'Khong tim thay du lieu') { return new ApiError(404, msg); }
  static conflict(msg = 'Du lieu da ton tai') { return new ApiError(409, msg); }
}

module.exports = { success, created, error, ApiError };
