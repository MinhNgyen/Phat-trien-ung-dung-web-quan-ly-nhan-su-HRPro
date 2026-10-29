import { describe, it, expect } from 'vitest';
import { deleteShiftMessage, graceOf, otOf, toShiftPayload, validateShift } from './shiftUtils';

describe('shiftUtils', () => {
  it('giá trị mặc định khi DB chưa có cột', () => {
    expect(graceOf({})).toBe(10);
    expect(otOf({})).toBe(1.5);
    expect(graceOf({ graceMinutes: 0 })).toBe(0);
  });
  it('validateShift báo thiếu và trùng mã', () => {
    const shifts = [{ id: 1, code: 'HC' }];
    expect(validateShift({ code: '', name: 'x' }, shifts)).toBeTruthy();
    expect(validateShift({ code: 'HC', name: 'x' }, shifts)).toMatch(/đã tồn tại/);
    expect(validateShift({ code: 'HC', name: 'x' }, shifts, 1)).toBeNull();
  });
  it('toShiftPayload ép kiểu số', () => {
    const p = toShiftPayload({ code: ' HC ', name: 'A', startTime: '08:00', endTime: '17:00', graceMinutes: '15', overtimeRate: '2' });
    expect(p.code).toBe('HC');
    expect(p.graceMinutes).toBe(15);
    expect(p.overtimeRate).toBe(2);
  });
  it('cảnh báo xóa khi ca đang có người dùng', () => {
    expect(deleteShiftMessage({ name: 'HC', employeeCount: 3 })).toMatch(/3 nhân viên/);
    expect(deleteShiftMessage({ name: 'HC', employeeCount: 0 })).toBe('Xóa ca HC?');
  });
});
