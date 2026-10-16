const prisma = require('../config/database');
const { ApiError } = require('../utils/response');
const { monthRange, toNumber } = require('../utils/helpers');
const { DEFAULTS: SETTINGS_DEFAULTS } = require('../controllers/settings.controller');

// Kiểm tra thang luong có bị khóa không
async function assertNotLocked(month) {
  const lock = await prisma.salaryLock.findUnique({ where: { month } });
  if (lock && lock.isLocked) {
    throw ApiError.forbidden(`Bang luong thang ${month} da bi khoa`);
  }
}

/**
 * Đọc cấu hình lương công ty từ bảng payroll_settings (singleton id=1).
 * Nếu chưa có bản ghi (chưa seed/chưa ai sửa lần nào), dùng giá trị mặc định
 * của controllers/settings.controller.js chứ không hard-code lại ở đây.
 */
async function getSettings() {
  const s = await prisma.payrollSetting.findUnique({ where: { id: 1 } });
  if (!s) return SETTINGS_DEFAULTS;
  return {
    standardDays: s.standardDays,
    ot: toNumber(s.ot),
    lunch: toNumber(s.lunch),
    fuel: toNumber(s.fuel),
    phoneAllow: toNumber(s.phoneAllow),
    bhxh: toNumber(s.bhxh),
    bhyt: toNumber(s.bhyt),
    bhtn: toNumber(s.bhtn),
    personalRelief: toNumber(s.personalRelief),
    latePenalty: toNumber(s.latePenalty),
  };
}

// Tính thuế thu nhập cá nhân (rút gọn, 1 bậc) dựa trên giảm trừ gia cảnh cấu hình được.
function calcTax(gross, personalRelief) {
  const taxable = gross - personalRelief;
  if (taxable <= 0) return 0;
  return Math.round(taxable * 0.1);
}

/**
 * Tính lương 1 nhân viên trong 1 tháng dựa trên dữ liệu chấm công thật + cấu hình công ty.
 *
 * grossSalary = baseSalary + overtime + allowance(phụ cấp cố định + phụ cấp tùy chỉnh)
 *               - deduction(bảo hiểm + phạt đi muộn + khấu trừ khác)
 * netSalary   = grossSalary - thuế TNCN
 */
async function calculateForEmployee(employee, month, options = {}) {
  const { start, end } = monthRange(month);
  const settings = await getSettings();

  const attendances = await prisma.attendance.findMany({
    where: { employeeId: employee.id, date: { gte: start, lt: end } },
  });

  // Ngày công: PRESENT + LATE được tính công
  const workDays = attendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  // Số lần đi muộn trong tháng -> dùng để tính phạt theo LẦN (không phải theo phút)
  const lateCount = attendances.filter((a) => a.status === 'LATE').length;
  const lateMinutes = attendances.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);

  // Giờ làm thêm: phần giờ vượt quá 8h/ngày hoặc bản ghi type = OVERTIME
  let overtimeHours = 0;
  for (const a of attendances) {
    const hours = toNumber(a.workHours);
    if (a.type === 'OVERTIME') overtimeHours += hours;
    else if (hours > 8) overtimeHours += hours - 8;
  }

  const salary = toNumber(employee.salary);
  const standardDays = options.standardDays || settings.standardDays;
  const otRate = options.overtimeRate || settings.ot;

  // Lương cơ bản theo ngày công thực tế
  const baseSalary = Math.round((salary / standardDays) * workDays);
  const hourlyRate = salary / standardDays / 8;
  const overtime = Math.round(overtimeHours * hourlyRate * otRate);

  // Phụ cấp cố định theo cấu hình công ty (ăn trưa + xăng xe + điện thoại) + phụ cấp tùy chỉnh khi tính lương
  const fixedAllowance = settings.lunch + settings.fuel + settings.phoneAllow;
  const customAllowance = options.allowance !== undefined ? options.allowance : 0;
  const allowance = fixedAllowance + customAllowance;

  // Bảo hiểm NV đóng: % trên lương cơ bản theo cấu hình (BHXH + BHYT + BHTN)
  const insuranceRate = (settings.bhxh + settings.bhyt + settings.bhtn) / 100;
  const insuranceDeduction = Math.round(baseSalary * insuranceRate);

  // Phạt đi muộn: tính theo SỐ LẦN đi muộn trong tháng x mức phạt cấu hình
  const latePenalty = lateCount * settings.latePenalty;

  const customDeduction = options.deduction !== undefined ? options.deduction : 0;
  const deduction = insuranceDeduction + latePenalty + customDeduction;

  const grossSalary = baseSalary + overtime + allowance - deduction;
  const tax = calcTax(grossSalary, settings.personalRelief);
  const netSalary = grossSalary - tax;

  return {
    employeeId: employee.id,
    month,
    baseSalary,
    workDays,
    standardDays,
    overtime,
    allowance,
    deduction,
    grossSalary,
    tax,
    netSalary,
    note: `Đi muộn ${lateCount} lần (${lateMinutes} phút), OT ${overtimeHours.toFixed(2)} giờ, BHXH/YT/TN ${toNumber(insuranceDeduction)}đ`,
  };
}

/**
 * Tính lương cho 1 nhân viên hoặc toàn bộ nhân viên đang làm việc.
 * Dùng upsert để không tạo bản ghi trùng (employeeId + month là unique).
 */
async function calculatePayroll({ month, employeeId, ...options }) {
  await assertNotLocked(month);

  const employees = await prisma.employee.findMany({
    where: employeeId ? { id: employeeId } : { status: { not: 'INACTIVE' } },
  });
  if (!employees.length) throw ApiError.notFound('Khong tim thay nhan vien de tinh luong');

  const results = [];
  for (const emp of employees) {
    const data = await calculateForEmployee(emp, month, options);
    const saved = await prisma.payroll.upsert({
      where: { employeeId_month: { employeeId: emp.id, month } },
      update: data,
      create: data,
      include: { employee: { select: { id: true, employeeCode: true, name: true } } },
    });
    results.push(saved);
  }
  return results;
}

async function lockMonth(month, userId) {
  return prisma.salaryLock.upsert({
    where: { month },
    update: { isLocked: true, lockedBy: userId, lockedAt: new Date() },
    create: { month, isLocked: true, lockedBy: userId },
  });
}

async function unlockMonth(month, userId) {
  const lock = await prisma.salaryLock.findUnique({ where: { month } });
  if (!lock) throw ApiError.notFound(`Thang ${month} chua bi khoa`);
  return prisma.salaryLock.update({
    where: { month },
    data: { isLocked: false, lockedBy: userId },
  });
}

module.exports = {
  calculatePayroll, calculateForEmployee, assertNotLocked,
  lockMonth, unlockMonth, calcTax, getSettings,
};
