import { describe, it, expect } from 'vitest';
import { statsOf, validateDepartment } from './departmentUtils';

describe('statsOf', () => {
  it('tính số người, quỹ lương, KPI trung bình (bỏ qua người chưa có KPI)', () => {
    const emps = [
      { id: 1, salary: 10, department: { id: 5 } },
      { id: 2, salary: 20, department: { id: 5 } },
      { id: 3, salary: 99, department: { id: 6 } },
    ];
    expect(statsOf({ id: 5 }, emps, { 1: 80 })).toEqual({ count: 2, salarySum: 30, avgKpi: 80 });
  });
});

describe('validateDepartment', () => {
  const depts = [{ id: 1, code: 'KT' }];
  it('báo thiếu và trùng mã', () => {
    expect(validateDepartment({ code: '', name: 'x' }, depts)).toBeTruthy();
    expect(validateDepartment({ code: 'KT', name: 'x' }, depts)).toMatch(/đã tồn tại/);
    expect(validateDepartment({ code: 'KT', name: 'x' }, depts, 1)).toBeNull();
  });
});
