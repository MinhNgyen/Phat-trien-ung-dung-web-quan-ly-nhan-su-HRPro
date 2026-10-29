import { describe, it, expect } from 'vitest';
import { salaryShare } from './reportUtils';

describe('salaryShare', () => {
  it('tính phần trăm quỹ lương từng phòng ban', () => {
    const r = salaryShare([{ name: 'A', salarySum: 30, color: '#1' }, { name: 'B', salarySum: 70, color: '#2' }]);
    expect(r).toEqual([{ name: 'A', color: '#1', pct: 30 }, { name: 'B', color: '#2', pct: 70 }]);
  });
  it('không có dữ liệu -> mảng rỗng; tổng 0 không chia cho 0', () => {
    expect(salaryShare([])).toEqual([]);
    expect(salaryShare([{ name: 'A', salarySum: 0, color: '#1' }])[0].pct).toBe(0);
  });
});
