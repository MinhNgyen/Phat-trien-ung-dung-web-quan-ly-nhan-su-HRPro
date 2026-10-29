import { describe, it, expect } from 'vitest';
import { attendanceStat, averageOf, deptDetail, filterByDept, greetingOf, payrollStat } from './dashboardUtils';

describe('attendanceStat', () => {
  it('tính tỷ lệ có mặt (đúng giờ + muộn), tối đa 100%', () => {
    expect(attendanceStat({ presentToday: 8, lateToday: 2, totalEmployees: 20 })).toEqual({ present: 10, percent: 50 });
    expect(attendanceStat({ presentToday: 30, lateToday: 0, totalEmployees: 20 }).percent).toBe(100);
  });
  it('không có nhân viên -> 0%, không chia cho 0', () => {
    expect(attendanceStat({ presentToday: 0, lateToday: 0, totalEmployees: 0 }).percent).toBe(0);
  });
});

describe('payrollStat', () => {
  it('ưu tiên thực chi trong tháng', () => {
    expect(payrollStat({ monthlyPayroll: 500, month: '2026-10' }, 100)).toEqual({ value: 500, sub: 'Thực chi tháng 2026-10' });
  });
  it('chưa tính lương -> dùng lương cơ bản', () => {
    expect(payrollStat({ monthlyPayroll: 0 }, 100).value).toBe(100);
    expect(payrollStat({ monthlyPayroll: 0 }, 100).sub).toMatch(/chưa tính/);
  });
});

describe('greetingOf / averageOf', () => {
  it('lời chào theo giờ', () => {
    expect(greetingOf(8)).toBe('Chào buổi sáng');
    expect(greetingOf(12)).toBe('Chào buổi trưa');
    expect(greetingOf(15)).toBe('Chào buổi chiều');
    expect(greetingOf(21)).toBe('Chào buổi tối');
  });
  it('averageOf', () => {
    expect(averageOf([80, 90])).toBe(85);
    expect(averageOf([])).toBeNull();
  });
});

describe('lọc / chi tiết phòng ban', () => {
  const emps = [
    { id: 1, salary: 10, status: 'ACTIVE', department: { id: 5, name: 'KT' } },
    { id: 2, salary: 20, status: 'LEAVE', department: { id: 5, name: 'KT' } },
    { id: 3, salary: 7, status: 'ACTIVE' },
  ];
  it('filterByDept', () => {
    expect(filterByDept(emps, 'KT')).toHaveLength(2);
    expect(filterByDept(emps, 'Chưa có')).toHaveLength(1);
    expect(filterByDept(emps, '')).toHaveLength(3);
  });
  it('deptDetail', () => {
    expect(deptDetail(emps, 'KT', { 1: 80, 2: 90 })).toEqual({ name: 'KT', id: 5, count: 2, active: 1, salarySum: 30, avgKpi: 85 });
    const none = deptDetail(emps, 'Chưa có', {});
    expect(none.id).toBeNull();
    expect(none.avgKpi).toBeNull();
  });
});

import { attendanceBuckets, countByRole, pendingKpi } from './dashboardUtils';

describe('khu việc cần xử lý theo vai trò', () => {
  const emps = [
    { id: 1, status: 'ACTIVE' }, { id: 2, status: 'ACTIVE' }, { id: 3, status: 'ACTIVE' },
    { id: 4, status: 'INACTIVE' }, { id: 5, status: 'ACTIVE' },
  ];
  const rows = [
    { id: 10, employeeId: 1, status: 'LATE' }, { id: 11, employeeId: 2, status: 'ABSENT' },
    { id: 12, employeeId: 3, status: 'LEAVE' }, { id: 13, employeeId: 1, status: 'PRESENT' },
  ];
  it('attendanceBuckets: muộn / vắng / nghỉ phép / chưa chấm công (bỏ người đã nghỉ việc)', () => {
    const b = attendanceBuckets(emps, rows);
    expect(b.late.map((r) => r.id)).toEqual([10]);
    expect(b.absent.map((r) => r.id)).toEqual([11]);
    expect(b.leave.map((r) => r.id)).toEqual([12]);
    expect(b.missing.map((e) => e.id)).toEqual([5]); // 4 đã nghỉ việc; 1,2,3 đã có bản ghi
  });
  it('attendanceBuckets: chưa ai chấm -> mọi nhân viên đang làm đều thiếu', () => {
    expect(attendanceBuckets(emps, []).missing).toHaveLength(4);
  });
  it('pendingKpi chỉ lấy người đang làm chưa có điểm', () => {
    expect(pendingKpi(emps, { 1: 80, 2: 0 }).map((e) => e.id)).toEqual([3, 5]);
  });
  it('countByRole đếm theo thứ tự, vai trò không có tài khoản vẫn là 0', () => {
    const users = [{ role: 'ADMIN' }, { role: 'hr' }, { role: 'HR' }];
    expect(countByRole(users, ['admin', 'hr', 'accountant'])).toEqual([
      { role: 'admin', count: 1 }, { role: 'hr', count: 2 }, { role: 'accountant', count: 0 },
    ]);
  });
});
