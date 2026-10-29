import { describe, it, expect } from 'vitest';
import { filterEmployees, nextEmployeeCode, planShiftSync, validateEmployee } from './employeeUtils';

const emps = [
  { id: 1, employeeCode: 'NV001', name: 'An Nguyễn', email: 'a@x.vn', position: 'Dev', status: 'ACTIVE', department: { id: 10 } },
  { id: 2, employeeCode: 'NV009', name: 'Bình Trần', email: 'b@x.vn', position: 'HR', status: 'LEAVE', department: { id: 20 } },
];
const goodForm = { name: 'C', code: 'NV010', email: 'c@x.vn', deptId: 10, shiftIds: [1], salary: '15000000' };

describe('filterEmployees', () => {
  it('lọc theo từ khóa, phòng ban, trạng thái', () => {
    expect(filterEmployees(emps, { q: 'bình' })).toHaveLength(1);
    expect(filterEmployees(emps, { dept: '10' })[0].id).toBe(1);
    expect(filterEmployees(emps, { status: 'LEAVE' })[0].id).toBe(2);
    expect(filterEmployees(emps, {})).toHaveLength(2);
  });
});

describe('nextEmployeeCode', () => {
  it('lấy số lớn nhất + 1', () => { expect(nextEmployeeCode(emps)).toBe('NV010'); });
  it('danh sách rỗng -> NV001', () => { expect(nextEmployeeCode([])).toBe('NV001'); });
});

describe('validateEmployee', () => {
  it('hợp lệ', () => { expect(validateEmployee(goodForm, emps)).toBeNull(); });
  it('thiếu email / lương thấp / trùng mã / trùng email', () => {
    expect(validateEmployee({ ...goodForm, email: '' }, emps)).toMatch(/email/i);
    expect(validateEmployee({ ...goodForm, salary: '500000' }, emps)).toMatch(/Lương/);
    expect(validateEmployee({ ...goodForm, code: 'NV001' }, emps)).toMatch(/đã tồn tại/);
    expect(validateEmployee({ ...goodForm, email: 'a@x.vn' }, emps)).toMatch(/Email/);
  });
  it('sửa chính mình thì không bị báo trùng', () => {
    expect(validateEmployee({ ...goodForm, code: 'NV001', email: 'a@x.vn' }, emps, 1)).toBeNull();
  });
});

describe('planShiftSync', () => {
  it('gỡ ca thừa, gán ca mới, ca đầu tiên là ca chính nếu chưa có', () => {
    const current = [{ shiftId: 1, isPrimary: true }, { shiftId: 2, isPrimary: false }];
    expect(planShiftSync(current, [2, 3])).toEqual({ toRemove: [1], toAdd: [{ shiftId: 3, isPrimary: true }] });
  });
  it('đã có ca chính thì ca mới không phải ca chính', () => {
    const current = [{ shiftId: 1, isPrimary: true }];
    expect(planShiftSync(current, [1, 2]).toAdd).toEqual([{ shiftId: 2, isPrimary: false }]);
  });
});
