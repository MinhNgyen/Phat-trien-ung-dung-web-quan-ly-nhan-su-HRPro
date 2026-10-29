import { describe, it, expect } from 'vitest';
import { DONUT_CIRCUMFERENCE, donutSegments } from './charts';
import { groupByDept } from './deptStats';

describe('donutSegments', () => {
  it('các cung cộng lại bằng cả vòng, offset nối tiếp nhau', () => {
    const segs = donutSegments([{ value: 1 }, { value: 3 }]);
    expect(segs[0].len + segs[1].len).toBeCloseTo(DONUT_CIRCUMFERENCE);
    expect(segs[0].offset).toBe(-0);
    expect(segs[1].offset).toBeCloseTo(-segs[0].len);
    expect(segs[0].len).toBeCloseTo(DONUT_CIRCUMFERENCE / 4);
  });
  it('dữ liệu rỗng hoặc toàn 0 không gây NaN', () => {
    expect(donutSegments([])).toEqual([]);
    expect(donutSegments([{ value: 0 }])[0].len).toBe(0);
  });
});

describe('groupByDept', () => {
  const emps = [
    { salary: 10, department: { id: 1, name: 'KT' } },
    { salary: 20, department: { id: 1, name: 'KT' } },
    { salary: 5 },
  ];
  it('gom theo tên, nhóm "Chưa có" cho người không có phòng ban', () => {
    expect(groupByDept(emps, (d) => (d ? '#a' : '#b'))).toEqual([
      { name: 'KT', count: 2, salarySum: 30, color: '#a' },
      { name: 'Chưa có', count: 1, salarySum: 5, color: '#b' },
    ]);
  });
});
