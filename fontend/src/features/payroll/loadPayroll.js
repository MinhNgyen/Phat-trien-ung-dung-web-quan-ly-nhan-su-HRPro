import { payrollApi } from '@/api/payroll';

// Nạp bảng lương 1 kỳ theo vai trò: nhân viên thường chỉ thấy phiếu của mình. -> { month, items, isLocked }
export async function loadPayrollForUser(user, month) {
  if (user.role === 'employee') {
    const [list, locks] = await Promise.all([payrollApi.byEmployee(user.employeeId), payrollApi.locks()]);
    return { month, items: list.filter((p) => p.month === month), isLocked: locks.some((l) => l.month === month && l.isLocked) };
  }
  return payrollApi.byMonth(month);
}
