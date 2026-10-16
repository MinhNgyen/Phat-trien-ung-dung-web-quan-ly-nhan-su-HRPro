const prisma = require('../config/database');
const { success } = require('../utils/response');
const { toNumber } = require('../utils/helpers');

// Giá trị mặc định khi bảng chưa có dữ liệu — khớp với SEED_SETTINGS cũ của frontend.
const DEFAULTS = {
  id: 1,
  company: 'Công ty TNHH HRPro Demo',
  email: 'hr@hrpro.vn',
  lunch: 730000,
  fuel: 500000,
  phoneAllow: 300000,
  ot: 1.5,
  bhxh: 8,
  bhyt: 1.5,
  bhtn: 1,
  personalRelief: 11000000,
  standardDays: 22,
  latePenalty: 50000,
};

// Chuyển Decimal của Prisma sang Number cho JSON gọn, dễ dùng ở frontend.
function format(s) {
  return {
    ...s,
    lunch: toNumber(s.lunch),
    fuel: toNumber(s.fuel),
    phoneAllow: toNumber(s.phoneAllow),
    ot: toNumber(s.ot),
    bhxh: toNumber(s.bhxh),
    bhyt: toNumber(s.bhyt),
    bhtn: toNumber(s.bhtn),
    personalRelief: toNumber(s.personalRelief),
    latePenalty: toNumber(s.latePenalty),
  };
}

// GET /api/settings/payroll — tự tạo bản ghi mặc định nếu chưa seed.
async function getPayrollSettings(req, res, next) {
  try {
    let s = await prisma.payrollSetting.findUnique({ where: { id: 1 } });
    if (!s) s = await prisma.payrollSetting.create({ data: DEFAULTS });
    return success(res, format(s), 'Lấy cấu hình lương thành công');
  } catch (err) { next(err); }
}

// PUT /api/settings/payroll — luôn ghi vào đúng 1 bản ghi id=1 (singleton).
async function updatePayrollSettings(req, res, next) {
  try {
    const s = await prisma.payrollSetting.upsert({
      where: { id: 1 },
      update: req.body,
      create: { ...DEFAULTS, ...req.body, id: 1 },
    });
    return success(res, format(s), 'Cập nhật cấu hình lương thành công');
  } catch (err) { next(err); }
}

module.exports = { getPayrollSettings, updatePayrollSettings, DEFAULTS };
